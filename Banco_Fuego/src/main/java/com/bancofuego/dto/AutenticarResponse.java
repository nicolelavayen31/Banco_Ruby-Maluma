package com.bancofuego.dto;

public record AutenticarResponse(
    String mensaje,
    String token,
    String tarjeta,
    String cuenta,
    String titular
) {}
