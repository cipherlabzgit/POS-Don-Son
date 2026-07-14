using FluentValidation;
using DMS_Backend.Models.DTOs.StoresIssueNotes;

namespace DMS_Backend.Validators.StoresIssueNotes;

public class UpdateStoresIssueNoteValidator : AbstractValidator<UpdateStoresIssueNoteDto>
{
    public UpdateStoresIssueNoteValidator()
    {
        When(x => x.Items != null, () =>
        {
            RuleForEach(x => x.Items).SetValidator(new UpdateStoresIssueNoteItemValidator()!);
        });
    }
}

public class UpdateStoresIssueNoteItemValidator : AbstractValidator<UpdateStoresIssueNoteItemDto>
{
    public UpdateStoresIssueNoteItemValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Item ID is required");

        When(x => x.ExtraQty.HasValue, () =>
        {
            RuleFor(x => x.ExtraQty!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Extra quantity must be non-negative");
        });

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes)
                .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
        });
    }
}
