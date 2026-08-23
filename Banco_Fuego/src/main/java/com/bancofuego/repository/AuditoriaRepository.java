package com.bancofuego.repository;

import com.bancofuego.domain.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findByNumeroCuentaOrderByCreadoEnDesc(String numeroCuenta);
}
