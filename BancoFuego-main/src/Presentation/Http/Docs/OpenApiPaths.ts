export const openApiPaths = {

    "/health": {
        get: {
            tags: [ "Sistema"],
            summary: "Comprueba que el proceso de la API está activo",
            responses: {
                "200": {
                    description:  "API activa",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    estado: {
                                        type: "string",
                                        example: "OK"
                                    },
                                    servicio: {
                                        type: "string",
                                        example: "BancoFuego API"
                                    },
                                    fecha: {
                                        type: "string",
                                        format: "date-time"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    "/api/auth/login": {
        post: {
            tags: [ "Autenticación"],
            summary: "Autentica una tarjeta mediante su PIN",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/LoginRequest"
                        }
                    }
                }
            },
            responses: {
                "200": {
                    description: "Autenticación correcta",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/LoginResponse"
                            }
                        }
                    }
                },
                "400": {
                    description:"Datos de entrada incorrectos"
                },
                "401": {
                    description: "PIN incorrecto"
                },
                "404": {
                    description: "Tarjeta, autenticación o cuenta no encontrada"
                }
            }
        }
    },

    "/api/operaciones/depositos": {
        post: {
            tags: [
                "Operaciones"
            ],
            summary: "Realiza un depósito en la cuenta autenticada",
            security: [{
                bearerAuth: []
            }],
            parameters: [{
                $ref: "#/components/parameters/IdempotencyKey"
            }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref:"#/components/schemas/OperacionRequest"
                        }
                    }
                }
            },
            responses: {
                "201": {
                    description: "Depósito registrado",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/OperacionResponse"
                            }
                        }
                    }
                },
                "400": {
                    description: "Monto o cabecera incorrectos"
                },
                "401": {
                    description: "Token ausente o inválido"
                },
                "409": {
                    description: "Conflicto de idempotencia"
                }
            }
        }
    },

    "/api/operaciones/retiros": {
        post: {
            tags: [ "Operaciones"],
            summary: "Realiza un retiro de la cuenta autenticada",
            security: [{
                bearerAuth: []
            }],
            parameters: [{
                $ref: "#/components/parameters/IdempotencyKey"
            }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/OperacionRequest"
                        }
                    }
                }
            },
            responses: {
                "201": {
                    description: "Retiro registrado",
                    content: {
                        "application/json": {
                            schema: {
                                $ref:"#/components/schemas/OperacionResponse"
                            }
                        }
                    }
                },
                "400": {
                    description: "Monto incorrecto"
                },
                "401": {
                    description: "Token ausente o inválido"
                },
                "409": {
                    description: "Fondos insuficientes o conflicto de idempotencia"
                }
            }
        }
    },

    "/api/transferencias": {
        post: {
            tags: [
                "Transferencias"
            ],
            summary: "Realiza una transferencia interna o interbancaria",
            security: [{
                bearerAuth: []
            }],
            parameters: [{
                $ref: "#/components/parameters/IdempotencyKey"
            }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            oneOf: [
                                {
                                    $ref: "#/components/schemas/TransferenciaInternaRequest"
                                },
                                {
                                    $ref: "#/components/schemas/TransferenciaInterbancariaRequest"
                                }
                            ]
                        }
                    }
                }
            },
            responses: {
                "201": {
                    description: "Transferencia procesada",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/TransferenciaResponse"
                            }
                        }
                    }
                },
                "400": {
                    description: "Destino o monto incorrecto"
                },
                "401": {
                    description: "Token ausente o inválido"
                },
                "409": {
                    description: "Conflicto de negocio o idempotencia"
                }
            }
        }
    },

    "/api/historial/me": {
        get: {
            tags: [
                "Historial"
            ],
            summary: "Obtiene el historial de la cuenta autenticada",
            security: [
                {
                    bearerAuth: []
                }
            ],
            responses: {
                "200": {
                    description: "Historial recuperado",
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: {
                                    $ref: "#/components/schemas/HistorialItem"
                                }
                            }
                        }
                    }
                },
                "401": {
                    description: "Token ausente o inválido"
                }
            }
        }
    }
};