package com.bancofuego.controller;

import com.bancofuego.config.JwtTokenProvider;
import com.bancofuego.dto.AutenticarRequest;
import com.bancofuego.dto.AutenticarResponse;
import com.bancofuego.dto.SaldoResponse;
import com.bancofuego.dto.TransferenciaRequest;
import com.bancofuego.service.CuentaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CuentaController.class)
class CuentaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CuentaService cuentaService;

    @MockBean
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void autenticar_RetornaToken_CuandoPinesCorrecto() throws Exception {
        // Arrange
        AutenticarRequest request = new AutenticarRequest("2026");
        AutenticarResponse response = new AutenticarResponse(
            "Autenticación exitosa", "mock-jwt-token", "8888777766665555", "8888777766665555", "fuego"
        );

        when(cuentaService.autenticar(eq("8888777766665555"), eq("2026"))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/cuentas/8888777766665555/autenticar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.titular").value("fuego"));
    }

    @Test
    void obtenerSaldo_Retorna401_CuandoNoAutenticado() throws Exception {
        // Act & Assert (sin JWT Bearer token y sin usuario mock)
        mockMvc.perform(get("/api/cuentas/8888777766665555/saldo"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "8888777766665555")
    void obtenerSaldo_RetornaSaldo_CuandoAutenticado() throws Exception {
        // Arrange
        SaldoResponse response = new SaldoResponse(BigDecimal.valueOf(1500.00), "fuego");
        when(cuentaService.obtenerSaldo("8888777766665555")).thenReturn(response);

        // Act & Assert
        mockMvc.perform(get("/api/cuentas/8888777766665555/saldo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(1500.00))
                .andExpect(jsonPath("$.titular").value("fuego"));
    }

    @Test
    @WithMockUser(username = "8888777766665555")
    void transferir_EjecutaLlamada_CuandoDatosValidos() throws Exception {
        // Arrange
        TransferenciaRequest request = new TransferenciaRequest(
            "1234567812345678", "Banco Ruby", BigDecimal.valueOf(50.00), "Regalo"
        );
        SaldoResponse saldoResponse = new SaldoResponse(BigDecimal.valueOf(950.00), "fuego");
        when(cuentaService.obtenerSaldo("8888777766665555")).thenReturn(saldoResponse);

        // Act & Assert
        mockMvc.perform(post("/api/cuentas/8888777766665555/transferir")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(950.00));

        verify(cuentaService, times(1)).transferir(
            eq("8888777766665555"), eq("1234567812345678"), eq("Banco Ruby"), eq(BigDecimal.valueOf(50.00)), eq("Regalo")
        );
    }
}
