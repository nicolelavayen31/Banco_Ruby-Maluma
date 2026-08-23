package com.bancofuego.dto;

import jakarta.validation.constraints.NotBlank;

public record AutenticarRequest(
    @NotBlank(message = "El PIN es obligatorio")
    String Pin
) {}
