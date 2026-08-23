package com.bancofuego.dto;

import java.math.BigDecimal;

public record OperacionResponse(
    String mensaje,
    BigDecimal saldo
) {}
