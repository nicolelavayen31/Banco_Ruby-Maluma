package com.bancofuego.service;

import com.bancofuego.dto.AutenticarResponse;
import com.bancofuego.dto.SaldoResponse;
import com.bancofuego.dto.CallbackRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface CuentaService {
    AutenticarResponse autenticar(String numeroCuenta, String pin);
    SaldoResponse obtenerSaldo(String numeroCuenta);
    void depositar(String numeroCuenta, BigDecimal monto);
    void retirar(String numeroCuenta, BigDecimal monto);
    void transferir(String numeroCuentaOrigen, String numeroCuentaDestino, String bancoDestino, BigDecimal monto, String concepto);
    void acreditarWebhook(CallbackRequest request);
    List<Map<String, Object>> obtenerHistorial(String numeroCuenta);
}
