package com.bancofuego.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CallbackRequest(
    String transactionId,
    String type,
    String bankAccountId,
    long amount, // en centavos
    String correlationId,
    String sourceBank,
    String description,
    String occurredOn
) {}
