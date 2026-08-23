package com.bancofuego.service;

import com.bancofuego.config.JwtTokenProvider;
import com.bancofuego.domain.Auditoria;
import com.bancofuego.domain.Cuenta;
import com.bancofuego.domain.Usuario;
import com.bancofuego.dto.CallbackRequest;
import com.bancofuego.exception.BusinessException;
import com.bancofuego.infrastructure.client.BanNetClient;
import com.bancofuego.repository.AuditoriaRepository;
import com.bancofuego.repository.CuentaRepository;
import com.bancofuego.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CuentaServiceTest {

    @Mock
    private CuentaRepository cuentaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AuditoriaRepository auditoriaRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private BanNetClient banNetClient;

    @InjectMocks
    private CuentaServiceImpl cuentaService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void transferir_LanzaExcepcion_CuandoSaldoInsuficienteConComision() {
        // Arrange
        Cuenta origen = new Cuenta();
        origen.setNumeroCuenta("8888777766665555");
        origen.setSaldo(BigDecimal.valueOf(10.00)); // Saldo: $10.00
        origen.setEstado(true);

        when(cuentaRepository.findByNumeroCuentaAndEstadoTrue("8888777766665555"))
            .thenReturn(Optional.of(origen));
        when(cuentaRepository.findByNumeroCuentaAndEstadoTrue("1234567812345678"))
            .thenReturn(Optional.empty()); // Banco externo, aplica comisión de $0.41

        // Act & Assert
        // Monto: $10.00 + Comisión $0.41 = $10.41 > $10.00
        BusinessException exception = assertThrows(BusinessException.class, () ->
            cuentaService.transferir("8888777766665555", "1234567812345678", "Banco Ruby", BigDecimal.valueOf(10.00), "Test")
        );

        assertEquals("Fondos insuficientes en la cuenta origen.", exception.getMessage());
        assertEquals(400, exception.getStatus());
        verify(cuentaRepository, never()).save(any());
    }

    @Test
    void transferir_AplicaRollback_CuandoBanNetFalla() {
        // Arrange
        Cuenta origen = new Cuenta();
        origen.setNumeroCuenta("8888777766665555");
        origen.setSaldo(BigDecimal.valueOf(100.00)); // Saldo: $100.00
        origen.setEstado(true);
        origen.setIntegradorAccountId("550e8400-e29b-41d4-a716-446655440203");

        when(cuentaRepository.findByNumeroCuentaAndEstadoTrue("8888777766665555"))
            .thenReturn(Optional.of(origen));
        when(cuentaRepository.findByNumeroCuentaAndEstadoTrue("1234567812345678"))
            .thenReturn(Optional.empty()); // Banco externo, aplica comisión

        // Simular fallo en el cliente de BanNet
        doThrow(new RuntimeException("Timeout de BanNet")).when(banNetClient)
            .enviarTransferencia(any(), any(), any(), any(), any());

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () ->
            cuentaService.transferir("8888777766665555", "1234567812345678", "Banco Ruby", BigDecimal.valueOf(10.00), "Test")
        );

        assertTrue(exception.getMessage().contains("Transacción fallida"));
        // El saldo debe haber vuelto a $100.00 tras el rollback
        assertEquals(BigDecimal.valueOf(100.00), origen.getSaldo());
        verify(auditoriaRepository, atLeastOnce()).save(any(Auditoria.class));
    }

    @Test
    void acreditarWebhook_EsIdempotente_CuandoTransaccionYaFueProcesada() {
        // Arrange
        Cuenta cuenta = new Cuenta();
        cuenta.setNumeroCuenta("8888777766665555");
        cuenta.setSaldo(BigDecimal.valueOf(100.00));
        cuenta.setEstado(true);

        when(cuentaRepository.findByIntegradorAccountIdAndEstadoTrue("550e8400-e29b-41d4-a716-446655440203"))
            .thenReturn(Optional.of(cuenta));

        // Registrar una auditoría previa que contiene el transactionId
        Auditoria auditPrevia = new Auditoria();
        auditPrevia.setTipo("Transferencia Interbancaria Recibida");
        auditPrevia.setDescripcion("Abono recibido. TxId: tx-unique-123. CorrelationId: corr-123");
        auditPrevia.setNumeroCuenta("8888777766665555");

        when(auditoriaRepository.findByNumeroCuentaOrderByCreadoEnDesc("8888777766665555"))
            .thenReturn(List.of(auditPrevia));

        CallbackRequest request = new CallbackRequest(
            "tx-unique-123", // Mismo ID
            "credit",
            "550e8400-e29b-41d4-a716-446655440203",
            1000, // $10.00 en centavos
            "corr-123",
            "bank_ruby",
            "Abono",
            "2026-08-23T17:22:51Z"
        );

        // Act
        cuentaService.acreditarWebhook(request);

        // Assert: no se debe haber sumado saldo ni guardado nada en DB
        assertEquals(BigDecimal.valueOf(100.00), cuenta.getSaldo());
        verify(cuentaRepository, never()).save(any());
        verify(auditoriaRepository, never()).save(any());
    }
}
