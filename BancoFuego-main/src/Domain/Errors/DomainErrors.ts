export class DomainError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 400
    ) {
        super(message);

        this.name = new.target.name;

        Object.setPrototypeOf(
            this,
            new.target.prototype
        );
    }
}

export class ValidationError extends DomainError {
    constructor(
        message: string,
        code = "VALIDATION_ERROR",
        statusCode = 400
    ) {
        super(message, code, statusCode);
    }
}

export class BusinessRuleError extends DomainError {
    constructor(
        message: string,
        code = "BUSINESS_RULE_ERROR",
        statusCode = 409
    ) {
        super(message, code, statusCode);
    }
}

export class TarjetaNoEncontradaError
    extends BusinessRuleError {

    constructor(
        message = "Tarjeta no encontrada"
    ) {
        super(
            message,
            "TARJETA_NO_ENCONTRADA",
            404
        );
    }
}

export class TarjetaNoUsableError
    extends BusinessRuleError {

    constructor(
        message = "La tarjeta no puede usarse en este momento",
        code = "TARJETA_NO_USABLE"
    ) {
        super(message, code, 403);
    }
}

export class TarjetaBloqueadaError
    extends TarjetaNoUsableError {

    constructor(
        message = "La tarjeta está bloqueada"
    ) {
        super(
            message,
            "TARJETA_BLOQUEADA"
        );
    }
}

export class TarjetaVencidaError
    extends TarjetaNoUsableError {

    constructor(
        message = "La tarjeta está vencida"
    ) {
        super(
            message,
            "TARJETA_VENCIDA"
        );
    }
}

export class AutenticacionNoEncontradaError
    extends BusinessRuleError {

    constructor(
        message =
            "No existe autenticación registrada para esta tarjeta"
    ) {
        super(
            message,
            "AUTENTICACION_NO_ENCONTRADA",
            404
        );
    }
}

export class PinIncorrectoError
    extends BusinessRuleError {

    constructor(
        message = "PIN incorrecto"
    ) {
        super(
            message,
            "PIN_INCORRECTO",
            401
        );
    }
}

export class CuentaNoEncontradaError
    extends BusinessRuleError {

    constructor(
        message = "Cuenta no encontrada"
    ) {
        super(
            message,
            "CUENTA_NO_ENCONTRADA",
            404
        );
    }
}

export class CuentaInactivaError
    extends BusinessRuleError {

    constructor(
        message = "La cuenta no está activa"
    ) {
        super(
            message,
            "CUENTA_INACTIVA",
            409
        );
    }
}

export class FondosInsuficientesError
    extends BusinessRuleError {

    constructor(
        message = "Fondos insuficientes"
    ) {
        super(
            message,
            "FONDOS_INSUFICIENTES",
            409
        );
    }
}

export class MontoInvalidoError
    extends ValidationError {

    constructor(message: string) {
        super(
            message,
            "MONTO_INVALIDO",
            400
        );
    }
}

export class OperacionNoSoportadaError
    extends BusinessRuleError {

    constructor(message: string) {
        super(
            message,
            "OPERACION_NO_SOPORTADA",
            501
        );
    }
}