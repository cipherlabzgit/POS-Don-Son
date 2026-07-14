using DMS_Backend.Models.DTOs.Transfers;
using FluentValidation;

namespace DMS_Backend.Validators.Transfers;

public class CreateTransferDtoValidator : AbstractValidator<CreateTransferDto>
{
    public CreateTransferDtoValidator()
    {
        RuleFor(x => x.TransferDate)
            .NotEmpty().WithMessage("Transfer date is required");

        RuleFor(x => x.FromOutletId)
            .NotEmpty().WithMessage("From outlet is required");

        RuleFor(x => x.ToOutletId)
            .NotEmpty().WithMessage("To outlet is required");

        RuleFor(x => x)
            .Must(x => x.FromOutletId != x.ToOutletId)
            .WithMessage("From outlet and To outlet must be different");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new CreateTransferItemDtoValidator());
    }
}

public class CreateTransferItemDtoValidator : AbstractValidator<CreateTransferItemDto>
{
    public CreateTransferItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");
    }
}
