using FluentValidation;
using DMS_Backend.Models.DTOs.ProductionPlans;

namespace DMS_Backend.Validators.ProductionPlans;

public class CreateProductionPlanValidator : AbstractValidator<CreateProductionPlanDto>
{
    public CreateProductionPlanValidator()
    {
        RuleFor(x => x.DeliveryPlanId)
            .NotEmpty().WithMessage("Delivery plan ID is required");

        RuleFor(x => x.Items)
            .NotNull().WithMessage("Items are required");

        RuleForEach(x => x.Items).SetValidator(new CreateProductionPlanItemValidator());
    }
}

public class CreateProductionPlanItemValidator : AbstractValidator<CreateProductionPlanItemDto>
{
    public CreateProductionPlanItemValidator()
    {
        RuleFor(x => x.ProductionSectionId)
            .NotEmpty().WithMessage("Production section ID is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.RegularFullQty)
            .GreaterThanOrEqualTo(0).WithMessage("Regular full quantity must be non-negative");

        RuleFor(x => x.RegularMiniQty)
            .GreaterThanOrEqualTo(0).WithMessage("Regular mini quantity must be non-negative");

        RuleFor(x => x.CustomizedFullQty)
            .GreaterThanOrEqualTo(0).WithMessage("Customized full quantity must be non-negative");

        RuleFor(x => x.CustomizedMiniQty)
            .GreaterThanOrEqualTo(0).WithMessage("Customized mini quantity must be non-negative");

        RuleFor(x => x.ProduceQty)
            .GreaterThanOrEqualTo(0).WithMessage("Produce quantity must be non-negative");
    }
}
