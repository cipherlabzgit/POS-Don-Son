using FluentValidation;
using DMS_Backend.Models.DTOs.FreezerStocks;

namespace DMS_Backend.Validators.FreezerStocks;

public sealed class AdjustFreezerStockValidator : AbstractValidator<AdjustFreezerStockDto>
{
    public AdjustFreezerStockValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.ProductionSectionId)
            .NotEmpty().WithMessage("Production section ID is required");

        RuleFor(x => x.Quantity)
            .NotEqual(0).WithMessage("Quantity cannot be zero")
            .GreaterThanOrEqualTo(-9999.9999m).WithMessage("Quantity cannot be less than -9999.9999")
            .LessThanOrEqualTo(9999.9999m).WithMessage("Quantity cannot exceed 9999.9999");

        RuleFor(x => x.TransactionType)
            .NotEmpty().WithMessage("Transaction type is required")
            .Must(x => new[] { "Addition", "Deduction", "Adjustment", "Transfer" }.Contains(x))
            .WithMessage("Transaction type must be Addition, Deduction, Adjustment, or Transfer");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(1000).WithMessage("Reason cannot exceed 1000 characters");

        RuleFor(x => x.ReferenceNo)
            .MaximumLength(100).WithMessage("Reference number cannot exceed 100 characters");
    }
}
