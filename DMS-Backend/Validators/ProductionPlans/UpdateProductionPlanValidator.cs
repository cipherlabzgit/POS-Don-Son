using FluentValidation;
using DMS_Backend.Models.DTOs.ProductionPlans;

namespace DMS_Backend.Validators.ProductionPlans;

public class UpdateProductionPlanValidator : AbstractValidator<UpdateProductionPlanDto>
{
    public UpdateProductionPlanValidator()
    {
        When(x => x.Items != null, () =>
        {
            RuleForEach(x => x.Items).SetValidator(new UpdateProductionPlanItemValidator()!);
        });
    }
}

public class UpdateProductionPlanItemValidator : AbstractValidator<UpdateProductionPlanItemDto>
{
    public UpdateProductionPlanItemValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Item ID is required");

        When(x => x.ProduceQty.HasValue, () =>
        {
            RuleFor(x => x.ProduceQty!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Produce quantity must be non-negative");
        });
    }
}
