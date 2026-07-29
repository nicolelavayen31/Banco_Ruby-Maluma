export const openApiSchemas = {
    ErrorResponse: {
        type: "object",
        required: ["mensaje"],
        properties: {
            mensaje: {
                type: "string",
                example: "La solicitud no pudo ser procesada"
            },
            codigo: {
                type: "string",
                example: "REGLA_NEGOCIO"
            },
            fecha: {
                type: "string",
                format: "date-time"
            }
        }
    },

    LoginRequest: {
        schemas: {
            ErrorResponse: {
                type: "object",
                required: [
                    "mensaje"
                ],
                properties: {
                    mensaje: {
                        type: "string",
                        example:  "La solicitud no pudo ser procesada"
                    },
                    codigo: {
                        type: "string",
                        example:  "REGLA_NEGOCIO"
                    },
                    fecha: {
                        type: "string",
                        format: "date-time"
                    }
                }
            },

            LoginRequest: {
                type: "object",
                required: [
                    "numeroTarjeta",
                    "pin"
                ],
                properties: {
                    numeroTarjeta: {
                        type: "string",
                        example: "4000000000000001"
                    },
                    pin: {
                        type: "string",
                        example: "1234"
                    }
                }
            },

            LoginResponse: {
                type: "object",
                required: [
                    "token",
                    "cuentaId",
                    "numeroCuenta",
                    "saldo"
                ],
                properties: {
                    token: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIs..."
                    },
                    cuentaId: {
                        type: "integer",
                        example: 1
                    },
                    numeroCuenta: {
                        type: "string",
                        example: "2200000001"
                    },
                    saldo: {
                        type: "number",
                        format: "double",
                        example: 850
                    }
                }
            },

            OperacionRequest: {
                type: "object",
                required: [
                    "monto"
                ],
                properties: {
                    monto: {
                        type: "number",
                        format: "double",
                        minimum: 0.01,
                        example: 100
                    }
                }
            },

            OperacionResponse: {
                type: "object",
                required: [
                    "saldoAnterior",
                    "saldoNuevo",
                    "transaccionId",
                    "movimientoId"
                ],
                properties: {
                    saldoAnterior: {
                        type: "number",
                        format: "double",
                        example: 500
                    },
                    saldoNuevo: {
                        type: "number",
                        format: "double",
                        example: 600
                    },
                    transaccionId: {
                        type: "integer",
                        example: 15
                    },
                    movimientoId: {
                        type: "integer",
                        example: 22
                    }
                }
            },

            TransferenciaInternaRequest: {
                type: "object",
                required: [
                    "tipoTransferencia",
                    "numeroCuentaDestino",
                    "monto"
                ],
                properties: {
                    tipoTransferencia: {
                        type: "string",
                        enum: [
                            "LOCAL"
                        ],
                        example: "LOCAL"
                    },
                    numeroCuentaDestino: {
                        type: "string",
                        example: "3300000002"
                    },
                    monto: {
                        type: "number",
                        format: "double",
                        minimum: 0.01,
                        example: 75
                    }
                }
            },

            TransferenciaInterbancariaRequest: {
                type: "object",
                required: [
                    "tipoTransferencia",
                    "numeroCuentaDestino",
                    "codigoBancoDestino",
                    "monto"
                ],
                properties: {
                    tipoTransferencia: {
                        type: "string",
                        enum: [
                            "INTERBANCARIA"
                        ],
                        example: "INTERBANCARIA"
                    },
                    numeroCuentaDestino: {
                        type: "string",
                        example: "3300000002"
                    },
                    codigoBancoDestino: {
                        type: "string",
                        example: "BANCO2"
                    },
                    monto: {
                        type: "number",
                        format: "double",
                        minimum: 0.01,
                        example: 75
                    },
                    concepto: {
                        type: "string",
                        example: "Pago de servicios"
                    }
                }
            },

            TransferenciaResponse: {
                type: "object",
                required: [
                    "tipo",
                    "origen",
                    "transaccionId"
                ],
                properties: {
                    tipo: {
                        type: "string",
                        enum: [
                            "TRANSFERENCIA_INTERNA",
                            "TRANSFERENCIA_EXTERNA"
                        ]
                    },
                    origen: {
                        type: "object",
                        properties: {
                            cuentaId: {
                                type: "integer"
                            },
                            saldoAnterior: {
                                type: "number"
                            },
                            saldoNuevo: {
                                type: "number"
                            }
                        }
                    },
                    destino: {
                        type: "object",
                        nullable: true,
                        properties: {
                            cuentaId: {
                                type: "integer"
                            },
                            saldoAnterior: {
                                type: "number"
                            },
                            saldoNuevo: {
                                type: "number"
                            }
                        }
                    },
                    transaccionId: {
                        type: "integer"
                    },
                    referenciaExterna: {
                        type: "string",
                        nullable: true
                    }
                }
            },

            HistorialItem: {
                type: "object",
                properties: {
                    movimientoId: {
                        type: "integer"
                    },
                    transaccionId: {
                        type: "integer"
                    },
                    tipo: {
                        type: "string"
                    },
                    monto: {
                        type: "number"
                    },
                    estado: {
                        type: "string"
                    },
                    fecha: {
                        type: "string",
                        format: "date-time"
                    },
                    descripcion: {
                        type: "string",
                        nullable: true
                    },
                    saldoAnterior: {
                        type: "number"
                    },
                    saldoPosterior: {
                        type: "number"
                    }
                }
            }
        }
    }
};