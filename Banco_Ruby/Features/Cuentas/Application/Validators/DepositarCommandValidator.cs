using FluentValidation;
using BancoCenit.Features.Cuentas.Application.Commands;

namespace BancoCenit.Features.Cuentas.Application.Validators
{
    public sealed class DepositarCommandValidator : AbstractValidator<DepositarCommand>
    {
        public DepositarCommandValidator()
        {
            RuleFor(x => x.NumeroCuenta)
                .NotEmpty().WithMessage("El número de cuenta es obligatorio.")
                .Length(10, 50).WithMessage("El número de cuenta debe tener entre 10 y 50 caracteres.");

            RuleFor(x => x.Monto)
                .GreaterThan(0).WithMessage("El monto a depositar debe ser mayor que cero.");
        }
    }
}
