package com.bancofuego.dto;

import java.math.BigDecimal;

public record SaldoResponse(
    BigDecimal saldo,
    String titular
) {}
