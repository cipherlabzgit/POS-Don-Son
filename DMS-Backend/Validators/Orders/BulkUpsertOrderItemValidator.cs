using FluentValidation;
using DMS_Backend.Models.DTOs.Orders;

namespace DMS_Backend.Validators.Orders;

public sealed class BulkUpsertOrderItemValidator : AbstractValidator<BulkUpsertOrderItemDto>
{
    public BulkUpsertOrderItemValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet ID is required");

        RuleFor(x => x.DeliveryTurnId)
            .NotEmpty().WithMessage("Delivery turn ID is required");

        RuleFor(x => x.FullQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Full quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Full quantity cannot exceed 9999.9999");

        RuleFor(x => x.MiniQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Mini quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Mini quantity cannot exceed 9999.9999");

        RuleFor(x => x.CustomizationNotes)
            .MaximumLength(500).WithMessage("Customization notes cannot exceed 500 characters");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
    }
}
