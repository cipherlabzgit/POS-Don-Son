using FluentValidation;
using DMS_Backend.Models.DTOs.ApprovalQueue;

namespace DMS_Backend.Validators.ApprovalQueue;

public sealed class RejectApprovalValidator : AbstractValidator<RejectApprovalDto>
{
    public RejectApprovalValidator()
    {
        RuleFor(x => x.RejectionReason)
            .NotEmpty().WithMessage("Rejection reason is required")
            .MinimumLength(10).WithMessage("Rejection reason must be at least 10 characters");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
    }
}
