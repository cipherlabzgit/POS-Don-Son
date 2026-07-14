using FluentValidation;
using DMS_Backend.Models.DTOs.ImmediateOrders;

namespace DMS_Backend.Validators.ImmediateOrders;

public sealed class CreateImmediateOrderValidator : AbstractValidator<CreateImmediateOrderDto>
{
    public CreateImmediateOrderValidator()
    {
        RuleFor(x => x.OrderBillNo)
            .NotEmpty().WithMessage("Order bill number is required")
            .MaximumLength(50).WithMessage("Order bill number cannot exceed 50 characters");

        RuleFor(x => x.OrderDate)
            .NotEmpty().WithMessage("Order date is required");

        RuleFor(x => x.NeedByDate)
            .NotEmpty().WithMessage("Need-by date is required")
            .GreaterThanOrEqualTo(x => x.OrderDate.Date)
            .WithMessage("Need-by date must be on or after the order date.");

        RuleFor(x => x.NeedByTime)
            .NotEmpty().WithMessage("Need-by time is required")
            .MaximumLength(20).WithMessage("Need-by time cannot exceed 20 characters");

        RuleFor(x => x.DeliveryDate)
            .NotEmpty().WithMessage("Delivery date is required");

        RuleFor(x => x.DeliveryTime)
            .NotEmpty().WithMessage("Delivery time is required")
            .MaximumLength(20).WithMessage("Delivery time cannot exceed 20 characters");

        RuleFor(x => x.ProductionStartingDate)
            .NotEmpty().WithMessage("Production starting date is required");

        RuleFor(x => x.ProductionStartingTime)
            .NotEmpty().WithMessage("Production starting time is required")
            .MaximumLength(20).WithMessage("Production starting time cannot exceed 20 characters");

        RuleFor(x => x.RecipeRequestNumber)
            .NotEmpty().WithMessage("Recipe request number is required")
            .MaximumLength(100).WithMessage("Recipe request number cannot exceed 100 characters");

        RuleFor(x => x.DeliveryTurnId)
            .NotEmpty().WithMessage("Delivery turn is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.FullQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Full quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Full quantity cannot exceed 9999.9999");

        RuleFor(x => x.MiniQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Mini quantity must be 0 or greater")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Mini quantity cannot exceed 9999.9999");

        RuleFor(x => x.RequestedBy)
            .NotEmpty().WithMessage("Requested by is required")
            .MaximumLength(200).WithMessage("Requested by cannot exceed 200 characters");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters");

        RuleFor(x => x.CustomizationNotes)
            .NotEmpty().WithMessage("Customization notes are required when the order is customized")
            .MaximumLength(1000).WithMessage("Customization notes cannot exceed 1000 characters")
            .When(x => x.IsCustomized);
    }
}
