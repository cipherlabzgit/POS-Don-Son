using FluentValidation;
using DMS_Backend.Models.DTOs.ProductionCancels;

namespace DMS_Backend.Validators.ProductionCancels;

public class CreateProductionCancelDtoValidator : AbstractValidator<CreateProductionCancelDto>
{
    public CreateProductionCancelDtoValidator()
    {
        RuleFor(x => x.CancelDate)
            .NotEmpty().WithMessage("Cancel date is required");

        RuleFor(x => x.ProductionNo)
            .NotEmpty().WithMessage("Production number is required")
            .MaximumLength(50).WithMessage("Production number must not exceed 50 characters");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");

        RuleFor(x => x.Lines)
            .NotEmpty().WithMessage("At least one product line is required")
            .Must(lines => lines != null && lines.Count > 0)
            .WithMessage("At least one product line is required");

        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.ProductId)
                .NotEmpty().WithMessage("Product is required");

            line.RuleFor(l => l.ProductionSectionId)
                .NotEmpty().WithMessage("Production section is required");

            line.RuleFor(l => l.CancelledQty)
                .GreaterThan(0).WithMessage("Cancelled quantity must be greater than 0");
        });
    }
}
