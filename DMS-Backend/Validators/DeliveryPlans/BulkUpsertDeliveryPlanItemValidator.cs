using FluentValidation;
using DMS_Backend.Models.DTOs.DeliveryPlans;

namespace DMS_Backend.Validators.DeliveryPlans;

public sealed class BulkUpsertDeliveryPlanItemValidator : AbstractValidator<BulkUpsertDeliveryPlanItemDto>
{
    public BulkUpsertDeliveryPlanItemValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet ID is required");

        RuleFor(x => x.FullQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Full quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Full quantity cannot exceed 9999.9999");

        RuleFor(x => x.MiniQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Mini quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Mini quantity cannot exceed 9999.9999");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
    }
}
