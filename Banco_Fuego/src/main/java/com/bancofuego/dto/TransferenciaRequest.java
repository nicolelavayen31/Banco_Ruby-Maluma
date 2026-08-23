package com.bancofuego.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TransferenciaRequest(
    @NotBlank(message = "La cuenta de destino es obligatoria")
    String CuentaDestino,
    
    String Banco,
    
    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    BigDecimal Monto,
    
    String Concepto
) {}
