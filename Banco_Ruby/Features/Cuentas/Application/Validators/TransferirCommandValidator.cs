using FluentValidation;
using BancoCenit.Features.Cuentas.Application.Commands;

namespace BancoCenit.Features.Cuentas.Application.Validators
{
    public sealed class TransferirCommandValidator : AbstractValidator<TransferirCommand>
    {
        public TransferirCommandValidator()
        {
            RuleFor(x => x.NumeroCuentaOrigen)
                .NotEmpty().WithMessage("El número de cuenta de origen es obligatorio.")
                .Length(10, 50).WithMessage("El número de cuenta de origen debe tener entre 10 y 50 caracteres.");

            RuleFor(x => x.NumeroCuentaDestino)
                .NotEmpty().WithMessage("El número de cuenta de destino es obligatorio.")
                .Length(10, 50).WithMessage("El número de cuenta de destino debe tener entre 10 y 50 caracteres.");

            RuleFor(x => x.Monto)
                .GreaterThan(0).WithMessage("El monto a transferir debe ser mayor que cero.");

            RuleFor(x => x)
                .Must(x => x.NumeroCuentaOrigen != x.NumeroCuentaDestino)
                .WithMessage("La cuenta de destino no puede ser la misma que la cuenta de origen.");
        }
    }
}
