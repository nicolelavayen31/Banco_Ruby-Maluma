package com.bancofuego.service;

import com.bancofuego.config.JwtTokenProvider;
import com.bancofuego.domain.Auditoria;
import com.bancofuego.domain.Cuenta;
import com.bancofuego.domain.Usuario;
import com.bancofuego.dto.AutenticarResponse;
import com.bancofuego.dto.CallbackRequest;
import com.bancofuego.dto.SaldoResponse;
import com.bancofuego.exception.BusinessException;
import com.bancofuego.infrastructure.client.BanNetClient;
import com.bancofuego.repository.AuditoriaRepository;
import com.bancofuego.repository.CuentaRepository;
import com.bancofuego.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class CuentaServiceImpl implements CuentaService {

    private final CuentaRepository cuentaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaRepository auditoriaRepository;
    private final JwtTokenProvider tokenProvider;
    private final BanNetClient banNetClient;

    public CuentaServiceImpl(
        CuentaRepository cuentaRepository,
        UsuarioRepository usuarioRepository,
        AuditoriaRepository auditoriaRepository,
        JwtTokenProvider tokenProvider,
        BanNetClient banNetClient
    ) {
        this.cuentaRepository = cuentaRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.tokenProvider = tokenProvider;
        this.banNetClient = banNetClient;
    }

    @Override
    @Transactional(readOnly = true)
    public AutenticarResponse autenticar(String numeroCuenta, String pin) {
        Cuenta cuenta = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuenta)
            .orElseThrow(() -> new BusinessException("Cuenta no encontrada o inactiva en Banco Fuego.", 404));

        Usuario usuario = cuenta.getUsuario();
        if (usuario == null || !BCrypt.checkpw(pin, usuario.getPin())) {
            throw new BusinessException("PIN incorrecto para Banco Fuego.", 401);
        }

        String token = tokenProvider.generateToken(numeroCuenta);

        return new AutenticarResponse(
            "Autenticación exitosa en Banco Fuego",
            token,
            cuenta.getNumeroCuenta(),
            cuenta.getNumeroCuenta(),
            usuario.getNombre()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SaldoResponse obtenerSaldo(String numeroCuenta) {
        Cuenta cuenta = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuenta)
            .orElseThrow(() -> new BusinessException("Cuenta no encontrada o inactiva.", 404));

        return new SaldoResponse(
            cuenta.getSaldo(),
            cuenta.getUsuario() != null ? cuenta.getUsuario().getNombre() : "Titular"
        );
    }

    @Override
    @Transactional
    public void depositar(String numeroCuenta, BigDecimal monto) {
        if (monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto debe ser mayor que cero.", 400);
        }

        Cuenta cuenta = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuenta)
            .orElseThrow(() -> new BusinessException("Cuenta no encontrada.", 404));

        cuenta.acreditar(monto);
        cuentaRepository.save(cuenta);

        Auditoria auditoria = new Auditoria(
            cuenta,
            cuenta.getNumeroCuenta(),
            "Depósito",
            monto,
            String.format("Depósito de $%s realizado exitosamente.", monto.setScale(2, RoundingMode.HALF_UP))
        );
        auditoriaRepository.save(auditoria);
    }

    @Override
    @Transactional
    public void retirar(String numeroCuenta, BigDecimal monto) {
        if (monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto debe ser mayor que cero.", 400);
        }

        Cuenta cuenta = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuenta)
            .orElseThrow(() -> new BusinessException("Cuenta no encontrada.", 404));

        try {
            cuenta.debitar(monto);
        } catch (IllegalStateException ex) {
            throw new BusinessException(ex.getMessage(), 400);
        }

        cuentaRepository.save(cuenta);

        Auditoria auditoria = new Auditoria(
            cuenta,
            cuenta.getNumeroCuenta(),
            "Retiro",
            monto,
            String.format("Retiro de $%s realizado exitosamente.", monto.setScale(2, RoundingMode.HALF_UP))
        );
        auditoriaRepository.save(auditoria);
    }

    @Override
    @Transactional
    public void transferir(
        String numeroCuentaOrigen,
        String numeroCuentaDestino,
        String bancoDestino,
        BigDecimal monto,
        String concepto
    ) {
        if (monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto debe ser mayor que cero.", 400);
        }

        if (numeroCuentaOrigen.equals(numeroCuentaDestino)) {
            throw new BusinessException("La cuenta origen y destino no pueden ser la misma.", 400);
        }

        Cuenta origen = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuentaOrigen)
            .orElseThrow(() -> new BusinessException("Cuenta origen no encontrada o inactiva.", 404));

        // Buscar cuenta destino local
        Cuenta destinoLocal = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuentaDestino).orElse(null);

        BigDecimal comision = (destinoLocal == null) ? BigDecimal.valueOf(0.41) : BigDecimal.ZERO;
        BigDecimal totalDebitado = monto.add(comision);

        if (origen.getSaldo().compareTo(totalDebitado) < 0) {
            throw new BusinessException("Fondos insuficientes en la cuenta origen.", 400);
        }

        // Snapshot de saldo
        BigDecimal saldoOrigenAntes = origen.getSaldo();
        BigDecimal saldoDestinoAntes = (destinoLocal != null) ? destinoLocal.getSaldo() : null;

        // Débito en origen
        origen.debitar(totalDebitado);
        cuentaRepository.save(origen);

        // Crédito local si corresponde
        if (destinoLocal != null) {
            destinoLocal.acreditar(monto);
            cuentaRepository.save(destinoLocal);
        }

        // Auditoría inicial del débito
        Auditoria auditDebito = new Auditoria(
            origen,
            origen.getNumeroCuenta(),
            "Transferencia Interbancaria Enviada",
            monto,
            destinoLocal == null
                ? String.format("Transferencia enviada a %s (Cuenta %s) por $%s más comisión de $%s.",
                    bancoDestino != null ? bancoDestino : "Banco Externo",
                    numeroCuentaDestino,
                    monto.setScale(2, RoundingMode.HALF_UP),
                    comision.setScale(2, RoundingMode.HALF_UP))
                : String.format("Transferencia local enviada a cuenta %s por $%s.",
                    numeroCuentaDestino,
                    monto.setScale(2, RoundingMode.HALF_UP))
        );
        auditoriaRepository.save(auditDebito);

        // Si es interbancaria, invocar al Interceptor BanNet
        if (destinoLocal == null) {
            String correlationId = UUID.randomUUID().toString();
            String cuentaOrigenUuid = origen.getIntegradorAccountId() != null ? origen.getIntegradorAccountId() : origen.getNumeroCuenta();
            String cuentaDestinoUuid = numeroCuentaDestino;

            try {
                banNetClient.enviarTransferencia(cuentaOrigenUuid, cuentaDestinoUuid, monto, concepto, correlationId);
            } catch (Exception ex) {
                // Compensación (Rollback) en memoria y base de datos
                origen.restaurarSaldo(saldoOrigenAntes);
                cuentaRepository.save(origen);

                Auditoria auditFallo = new Auditoria(
                    origen,
                    origen.getNumeroCuenta(),
                    "Transferencia Fallida",
                    monto,
                    String.format("Transacción fallida. Se devolvió el monto $%s a la cuenta %s. Detalle: %s",
                        monto.setScale(2, RoundingMode.HALF_UP),
                        origen.getNumeroCuenta(),
                        ex.getMessage())
                );
                auditoriaRepository.save(auditFallo);

                throw new BusinessException("Transacción fallida... Detalle: " + ex.getMessage(), 400);
            }
        } else {
            // Auditoría del crédito local
            Auditoria auditCredito = new Auditoria(
                destinoLocal,
                destinoLocal.getNumeroCuenta(),
                "Transferencia Recibida",
                monto,
                String.format("Transferencia local recibida desde cuenta %s por $%s.",
                    numeroCuentaOrigen,
                    monto.setScale(2, RoundingMode.HALF_UP))
            );
            auditoriaRepository.save(auditCredito);
        }
    }

    @Override
    @Transactional
    public void acreditarWebhook(CallbackRequest request) {
        if (request.type() != null && !request.type().equalsIgnoreCase("credit")) {
            // El webhook es de tipo debit u otro, no nos corresponde acreditar
            return;
        }

        Cuenta cuenta = cuentaRepository.findByIntegradorAccountIdAndEstadoTrue(request.bankAccountId())
            .or(() -> cuentaRepository.findByNumeroCuentaAndEstadoTrue(request.bankAccountId()))
            .orElseThrow(() -> new BusinessException("Cuenta destino " + request.bankAccountId() + " no encontrada o inactiva en Banco Fuego.", 404));

        // Verificar idempotencia
        List<Auditoria> historial = auditoriaRepository.findByNumeroCuentaOrderByCreadoEnDesc(cuenta.getNumeroCuenta());
        for (Auditoria aud : historial) {
            if ("Transferencia Interbancaria Recibida".equalsIgnoreCase(aud.getTipo())
                    && aud.getDescripcion() != null
                    && aud.getDescripcion().contains(request.transactionId())) {
                // Ya se procesó esta transacción, omitir
                return;
            }
        }

        BigDecimal monto = BigDecimal.valueOf(request.amount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        cuenta.acreditar(monto);
        cuentaRepository.save(cuenta);

        Auditoria auditoria = new Auditoria(
            cuenta,
            cuenta.getNumeroCuenta(),
            "Transferencia Interbancaria Recibida",
            monto,
            String.format("Abono recibido vía Integrador ATM desde %s. Concepto: %s. TxId: %s. CorrelationId: %s",
                request.sourceBank() != null ? request.sourceBank() : "Banco Externo",
                request.description() != null ? request.description() : "Transferencia Interbancaria",
                request.transactionId(),
                request.correlationId())
        );
        auditoriaRepository.save(auditoria);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerHistorial(String numeroCuenta) {
        Cuenta cuenta = cuentaRepository.findByNumeroCuentaAndEstadoTrue(numeroCuenta)
            .orElseThrow(() -> new BusinessException("Cuenta no encontrada.", 404));

        List<Auditoria> historial = auditoriaRepository.findByNumeroCuentaOrderByCreadoEnDesc(numeroCuenta);
        List<Map<String, Object>> response = new ArrayList<>();

        for (Auditoria aud : historial) {
            Map<String, Object> map = new HashMap<>();
            map.put("tipo", aud.getTipo());
            map.put("monto", aud.getMonto());
            map.put("descripcion", aud.getDescripcion());
            map.put("creadoEn", aud.getCreadoEn());
            response.add(map);
        }

        return response;
    }
}
