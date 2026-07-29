using FluentValidation;
using BancoCenit.Features.Cuentas.Application.Commands;

namespace BancoCenit.Features.Cuentas.Application.Validators
{
    public sealed class RetirarCommandValidator : AbstractValidator<RetirarCommand>
    {
        public RetirarCommandValidator()
        {
            RuleFor(x => x.NumeroCuenta)
                .NotEmpty().WithMessage("El número de cuenta es obligatorio.")
                .Length(10, 50).WithMessage("El número de cuenta debe tener entre 10 y 50 caracteres.");

            RuleFor(x => x.Monto)
                .GreaterThan(0).WithMessage("El monto a retirar debe ser mayor que cero.");
        }
    }
}
