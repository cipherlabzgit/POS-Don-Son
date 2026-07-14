using DMS_Backend.Models.DTOs.Disposals;
using FluentValidation;

namespace DMS_Backend.Validators.Disposals;

public class UpdateDisposalDtoValidator : AbstractValidator<UpdateDisposalDto>
{
    public UpdateDisposalDtoValidator()
    {
        RuleFor(x => x.DisposalDate)
            .NotEmpty().WithMessage("Disposal date is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new UpdateDisposalItemDtoValidator());
    }
}

public class UpdateDisposalItemDtoValidator : AbstractValidator<UpdateDisposalItemDto>
{
    public UpdateDisposalItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");
    }
}
