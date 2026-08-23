package com.bancofuego.infrastructure.client;

import com.bancofuego.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class BanNetClientImpl implements BanNetClient {

    private final RestClient restClient;
    private final String baseUrl;
    private final String apiKey;
    private final String sourceBank;

    public BanNetClientImpl(
        RestClient.Builder restClientBuilder,
        @Value("${bannet.base-url}") String baseUrl,
        @Value("${bannet.api-key}") String apiKey,
        @Value("${bannet.source-bank}") String sourceBank
    ) {
        this.restClient = restClientBuilder.build();
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.sourceBank = sourceBank;
    }

    @Override
    @SuppressWarnings("unchecked")
    public void enviarTransferencia(
        String cuentaOrigenUuid,
        String cuentaDestinoUuid,
        BigDecimal monto,
        String concepto,
        String correlationId
    ) {
        try {
            // PASO 1: Obtener token CSRF y cookie de sesión (GET /api/csrf-token)
            ResponseEntity<Map> csrfResponse = restClient.get()
                .uri(baseUrl + "/api/csrf-token")
                .header("x-api-version", "1")
                .retrieve()
                .toEntity(Map.class);

            if (!csrfResponse.getStatusCode().is2xxSuccessful() || csrfResponse.getBody() == null) {
                throw new BusinessException("No se pudo obtener el token CSRF de BanNet", 502);
            }

            String csrfToken = (String) csrfResponse.getBody().get("token");
            List<String> cookieHeaders = csrfResponse.getHeaders().get("Set-Cookie");
            String cookie = cookieHeaders != null ? String.join("; ", cookieHeaders) : "";

            if (csrfToken == null) {
                throw new BusinessException("Token CSRF devuelto es nulo", 502);
            }

            // PASO 2: Convertir monto a centavos (BanNet trabaja con enteros en centavos)
            long montoEnCentavos = monto.multiply(BigDecimal.valueOf(100)).longValue();

            // PASO 3: Construir payload de transferencia
            Map<String, Object> payload = new HashMap<>();
            payload.put("from_account_id", cuentaOrigenUuid);
            payload.put("to_account_id", cuentaDestinoUuid);
            payload.put("amount", montoEnCentavos);
            payload.put("description", concepto != null ? concepto : "Transferencia Interbancaria");
            payload.put("source_bank", sourceBank);
            payload.put("correlation_id", correlationId);

            // PASO 4: Enviar POST a /api/transactions/transfer
            ResponseEntity<String> postResponse = restClient.post()
                .uri(baseUrl + "/api/transactions/transfer")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-api-version", "1")
                .header("X-Api-Key", apiKey)
                .header("x-csrf-token", csrfToken)
                .header("Cookie", cookie)
                .body(payload)
                .retrieve()
                .toEntity(String.class);

            if (!postResponse.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("Fallo al registrar transferencia en BanNet: " + postResponse.getBody(), 502);
            }
        } catch (Exception ex) {
            if (ex instanceof BusinessException) {
                throw (BusinessException) ex;
            }
            throw new BusinessException("Error de comunicación con el Interceptor BanNet: " + ex.getMessage(), 502);
        }
    }
}
