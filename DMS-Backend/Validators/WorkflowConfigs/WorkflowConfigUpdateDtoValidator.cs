using DMS_Backend.Models.DTOs.WorkflowConfigs;
using FluentValidation;

namespace DMS_Backend.Validators.WorkflowConfigs;

public class WorkflowConfigUpdateDtoValidator : AbstractValidator<WorkflowConfigUpdateDto>
{
    public WorkflowConfigUpdateDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(50).WithMessage("Code must not exceed 50 characters");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.EntityType)
            .NotEmpty().WithMessage("EntityType is required")
            .MaximumLength(100).WithMessage("EntityType must not exceed 100 characters");

        RuleFor(x => x.WorkflowType)
            .NotEmpty().WithMessage("WorkflowType is required")
            .MaximumLength(50).WithMessage("WorkflowType must not exceed 50 characters");

        RuleFor(x => x.ApprovalLevels)
            .GreaterThan(0).WithMessage("ApprovalLevels must be greater than 0")
            .LessThanOrEqualTo(10).WithMessage("ApprovalLevels must not exceed 10");

        RuleFor(x => x.TimeoutHours)
            .GreaterThan(0).WithMessage("TimeoutHours must be greater than 0")
            .When(x => x.TimeoutHours.HasValue);
    }
}
