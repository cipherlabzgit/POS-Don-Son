using FluentValidation;
using DMS_Backend.Models.DTOs.ApprovalQueue;

namespace DMS_Backend.Validators.ApprovalQueue;

public sealed class CreateApprovalQueueValidator : AbstractValidator<CreateApprovalQueueDto>
{
    public CreateApprovalQueueValidator()
    {
        RuleFor(x => x.ApprovalType)
            .NotEmpty().WithMessage("Approval type is required")
            .MaximumLength(50).WithMessage("Approval type cannot exceed 50 characters");

        RuleFor(x => x.EntityId)
            .NotEmpty().WithMessage("Entity ID is required");

        RuleFor(x => x.EntityReference)
            .MaximumLength(200).WithMessage("Entity reference cannot exceed 200 characters");

        RuleFor(x => x.RequestedById)
            .NotEmpty().WithMessage("Requested by user is required");

        RuleFor(x => x.Priority)
            .GreaterThanOrEqualTo(0).WithMessage("Priority must be 0 or greater");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters");
    }
}
