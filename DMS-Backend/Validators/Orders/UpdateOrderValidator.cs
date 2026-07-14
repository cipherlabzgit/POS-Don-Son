using FluentValidation;
using DMS_Backend.Models.DTOs.Orders;

namespace DMS_Backend.Validators.Orders;

public sealed class UpdateOrderValidator : AbstractValidator<UpdateOrderDto>
{
    public UpdateOrderValidator()
    {
        RuleFor(x => x.OrderNo)
            .NotEmpty().WithMessage("Order number is required")
            .MaximumLength(50).WithMessage("Order number cannot exceed 50 characters");

        RuleFor(x => x.OrderDate)
            .NotEmpty().WithMessage("Order date is required");

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
            .MaximumLength(100).WithMessage("Recipe request number cannot exceed 100 characters");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters");
    }
}
