package com.bancofuego.controller;

import com.bancofuego.dto.*;
import com.bancofuego.exception.BusinessException;
import com.bancofuego.service.CuentaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Cuentas", description = "Endpoints para operaciones financieras de Banco Fuego")
public class CuentaController {

    private final CuentaService cuentaService;
    private final String apiKeyBanNet;

    public CuentaController(
        CuentaService cuentaService,
        @Value("${bannet.api-key}") String apiKeyBanNet
    ) {
        this.cuentaService = cuentaService;
        this.apiKeyBanNet = apiKeyBanNet;
    }

    @PostMapping("/cuentas/{numero}/autenticar")
    @Operation(summary = "Autenticar cuenta con PIN", description = "Valida el PIN de la cuenta y devuelve un token JWT")
    @ApiResponse(responseCode = "200", description = "Autenticación exitosa")
    @ApiResponse(responseCode = "401", description = "PIN incorrecto")
    @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
    public ResponseEntity<AutenticarResponse> autenticar(
        @PathVariable String numero,
        @Valid @RequestBody AutenticarRequest request
    ) {
        AutenticarResponse response = cuentaService.autenticar(numero, request.Pin());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cuentas/{numero}/saldo")
    @Operation(summary = "Consultar saldo de cuenta", description = "Devuelve el saldo y titular de una cuenta activa")
    @ApiResponse(responseCode = "200", description = "Consulta exitosa")
    @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
    public ResponseEntity<SaldoResponse> obtenerSaldo(@PathVariable String numero) {
        SaldoResponse response = cuentaService.obtenerSaldo(numero);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cuentas/{numero}/depositar")
    @Operation(summary = "Depositar fondos", description = "Acredita efectivo localmente en la cuenta")
    @ApiResponse(responseCode = "200", description = "Depósito exitoso")
    @ApiResponse(responseCode = "400", description = "Monto inválido")
    public ResponseEntity<OperacionResponse> depositar(
        @PathVariable String numero,
        @Valid @RequestBody OperacionMontoRequest request
    ) {
        cuentaService.depositar(numero, request.Monto());
        SaldoResponse saldo = cuentaService.obtenerSaldo(numero);
        return ResponseEntity.ok(new OperacionResponse(
            String.format("Depósito de $%s realizado exitosamente.", request.Monto()),
            saldo.saldo()
        ));
    }

    @PostMapping("/cuentas/{numero}/retirar")
    @Operation(summary = "Retirar fondos", description = "Debita efectivo localmente de la cuenta")
    @ApiResponse(responseCode = "200", description = "Retiro exitoso")
    @ApiResponse(responseCode = "400", description = "Fondos insuficientes o monto inválido")
    public ResponseEntity<OperacionResponse> retirar(
        @PathVariable String numero,
        @Valid @RequestBody OperacionMontoRequest request
    ) {
        cuentaService.retirar(numero, request.Monto());
        SaldoResponse saldo = cuentaService.obtenerSaldo(numero);
        return ResponseEntity.ok(new OperacionResponse(
            String.format("Retiro de $%s realizado exitosamente.", request.Monto()),
            saldo.saldo()
        ));
    }

    @PostMapping("/cuentas/{numero}/transferir")
    @Operation(summary = "Transferir fondos", description = "Realiza una transferencia local o interbancaria hacia BanNet")
    @ApiResponse(responseCode = "200", description = "Transferencia realizada")
    @ApiResponse(responseCode = "400", description = "Saldo insuficiente u otros errores")
    public ResponseEntity<OperacionResponse> transferir(
        @PathVariable String numero,
        @Valid @RequestBody TransferenciaRequest request
    ) {
        cuentaService.transferir(numero, request.CuentaDestino(), request.Banco(), request.Monto(), request.Concepto());
        SaldoResponse saldo = cuentaService.obtenerSaldo(numero);
        return ResponseEntity.ok(new OperacionResponse(
            String.format("Transferencia de $%s realizada exitosamente.", request.Monto()),
            saldo.saldo()
        ));
    }

    @GetMapping("/cuentas/{numero}/historial")
    @Operation(summary = "Consultar historial de movimientos", description = "Obtiene los registros de auditoría de la cuenta")
    @ApiResponse(responseCode = "200", description = "Consulta exitosa")
    public ResponseEntity<HistorialResponse> obtenerHistorial(@PathVariable String numero) {
        SaldoResponse saldo = cuentaService.obtenerSaldo(numero);
        var historial = cuentaService.obtenerHistorial(numero);
        return ResponseEntity.ok(new HistorialResponse(saldo.titular(), historial));
    }

    @PostMapping("/cuentas/{numero}/credito")
    @Operation(summary = "Webhook de crédito interbancario", description = "Callback utilizado por el Interceptor BanNet para acreditar abonos")
    public ResponseEntity<Map<String, Object>> acreditarWebhook(
        @PathVariable String numero,
        @RequestHeader(value = "X-Api-Key", required = false) String apiKey,
        @Valid @RequestBody CallbackRequest request
    ) {
        validarApiKey(apiKey);
        cuentaService.acreditarWebhook(request);
        return ResponseEntity.ok(Map.of("recibido", true));
    }

    @PostMapping("/transferencias/interbancarias/callback")
    @Operation(summary = "Callback general de conciliación", description = "Endpoint invocado por el Interceptor para actualizar transacciones o notificar conciliaciones")
    public ResponseEntity<Map<String, Object>> callbackGeneral(
        @RequestHeader(value = "X-Api-Key", required = false) String apiKey,
        @RequestBody CallbackRequest request
    ) {
        validarApiKey(apiKey);
        cuentaService.acreditarWebhook(request);
        return ResponseEntity.ok(Map.of("recibido", true));
    }

    private void validarApiKey(String apiKey) {
        if (apiKey == null || !apiKey.equals(apiKeyBanNet)) {
            throw new BusinessException("Acceso denegado: API Key de BanNet inválida.", 401);
        }
    }
}
