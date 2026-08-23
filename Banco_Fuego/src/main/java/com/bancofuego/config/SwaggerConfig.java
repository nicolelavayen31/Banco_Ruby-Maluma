package com.bancofuego.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Banco Fuego API")
                .version("1.0")
                .description("API del Banco Fuego integrada con la red BanNet"))
            .addSecurityItem(new SecurityRequirement().addList("BearerAuth").addList("ApiKeyAuth"))
            .components(new Components()
                .addSecuritySchemes("BearerAuth", new SecurityScheme()
                    .name("BearerAuth")
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Ingrese el token JWT obtenido del endpoint de autenticación"))
                .addSecuritySchemes("ApiKeyAuth", new SecurityScheme()
                    .name("X-Api-Key")
                    .type(SecurityScheme.Type.APIKEY)
                    .in(SecurityScheme.In.HEADER)
                    .description("Clave API para llamadas del Interceptor")));
    }
}
