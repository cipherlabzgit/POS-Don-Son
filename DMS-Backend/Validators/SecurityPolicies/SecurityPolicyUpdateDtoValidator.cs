using DMS_Backend.Models.DTOs.SecurityPolicies;
using FluentValidation;

namespace DMS_Backend.Validators.SecurityPolicies;

public class SecurityPolicyUpdateDtoValidator : AbstractValidator<SecurityPolicyUpdateDto>
{
    public SecurityPolicyUpdateDtoValidator()
    {
        RuleFor(x => x.PolicyKey)
            .NotEmpty().WithMessage("PolicyKey is required")
            .MaximumLength(100).WithMessage("PolicyKey must not exceed 100 characters");

        RuleFor(x => x.PolicyName)
            .NotEmpty().WithMessage("PolicyName is required")
            .MaximumLength(200).WithMessage("PolicyName must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .MaximumLength(50).WithMessage("Category must not exceed 50 characters");

        RuleFor(x => x.ValueType)
            .NotEmpty().WithMessage("ValueType is required")
            .MaximumLength(50).WithMessage("ValueType must not exceed 50 characters");

        RuleFor(x => x.SeverityLevel)
            .MaximumLength(20).WithMessage("SeverityLevel must not exceed 20 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.SeverityLevel));
    }
}
