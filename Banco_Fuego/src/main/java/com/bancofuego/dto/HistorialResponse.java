package com.bancofuego.dto;

import java.util.List;
import java.util.Map;

public record HistorialResponse(
    String titular,
    List<Map<String, Object>> historial
) {}
