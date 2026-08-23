package com.bancofuego.infrastructure.client;

import java.math.BigDecimal;

public interface BanNetClient {
    void enviarTransferencia(String cuentaOrigenUuid, String cuentaDestinoUuid, BigDecimal monto, String concepto, String correlationId);
}
