using FluentValidation;
using DMS_Backend.Models.DTOs.StoresIssueNotes;

namespace DMS_Backend.Validators.StoresIssueNotes;

public class CreateStoresIssueNoteValidator : AbstractValidator<CreateStoresIssueNoteDto>
{
    public CreateStoresIssueNoteValidator()
    {
        RuleFor(x => x.ProductionPlanId)
            .NotEmpty().WithMessage("Production plan ID is required");

        RuleFor(x => x.ProductionSectionId)
            .NotEmpty().WithMessage("Production section ID is required");

        RuleFor(x => x.IssueDate)
            .NotEmpty().WithMessage("Issue date is required");

        RuleFor(x => x.Items)
            .NotNull().WithMessage("Items are required")
            .Must(items => items.Count > 0).WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new CreateStoresIssueNoteItemValidator());
    }
}

public class CreateStoresIssueNoteItemValidator : AbstractValidator<CreateStoresIssueNoteItemDto>
{
    public CreateStoresIssueNoteItemValidator()
    {
        RuleFor(x => x.IngredientId)
            .NotEmpty().WithMessage("Ingredient ID is required");

        RuleFor(x => x.ProductionQty)
            .GreaterThanOrEqualTo(0).WithMessage("Production quantity must be non-negative");

        RuleFor(x => x.ExtraQty)
            .GreaterThanOrEqualTo(0).WithMessage("Extra quantity must be non-negative");

        RuleFor(x => x.TotalQty)
            .GreaterThan(0).WithMessage("Total quantity must be greater than zero");

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes)
                .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
        });
    }
}
