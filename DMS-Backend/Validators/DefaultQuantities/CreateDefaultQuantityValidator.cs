using FluentValidation;
using DMS_Backend.Models.DTOs.DefaultQuantities;

namespace DMS_Backend.Validators.DefaultQuantities;

public sealed class CreateDefaultQuantityValidator : AbstractValidator<CreateDefaultQuantityDto>
{
    public CreateDefaultQuantityValidator()
    {
        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet ID is required");

        RuleFor(x => x.DayTypeId)
            .NotEmpty().WithMessage("Day Type ID is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.FullQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Full quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Full quantity cannot exceed 9999.9999");

        RuleFor(x => x.MiniQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Mini quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Mini quantity cannot exceed 9999.9999");
    }
}
