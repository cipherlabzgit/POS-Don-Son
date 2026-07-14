using DMS_Backend.Models.DTOs.StockAdjustments;
using FluentValidation;

namespace DMS_Backend.Validators.StockAdjustments;

public class UpdateStockAdjustmentDtoValidator : AbstractValidator<UpdateStockAdjustmentDto>
{
    public UpdateStockAdjustmentDtoValidator()
    {
        RuleFor(x => x.AdjustmentDate)
            .NotEmpty().WithMessage("Adjustment date is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.AdjustmentType)
            .NotEmpty().WithMessage("Adjustment type is required")
            .Must(type => type == "Increase" || type == "Decrease")
            .WithMessage("Adjustment type must be Increase or Decrease");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters");
    }
}
