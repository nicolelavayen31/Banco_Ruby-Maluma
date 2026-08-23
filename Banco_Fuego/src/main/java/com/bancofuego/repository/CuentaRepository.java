package com.bancofuego.repository;

import com.bancofuego.domain.Cuenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CuentaRepository extends JpaRepository<Cuenta, Long> {
    Optional<Cuenta> findByNumeroCuentaAndEstadoTrue(String numeroCuenta);
    Optional<Cuenta> findByIntegradorAccountIdAndEstadoTrue(String integradorAccountId);
}
