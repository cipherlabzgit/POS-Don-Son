using FluentValidation;
using DMS_Backend.Models.DTOs.SystemSettings;

namespace DMS_Backend.Validators.SystemSettings;

public sealed class UpdateSystemSettingValidator : AbstractValidator<UpdateSystemSettingDto>
{
    public UpdateSystemSettingValidator()
    {
        RuleFor(x => x.SettingKey)
            .NotEmpty().WithMessage("Setting key is required")
            .MaximumLength(100).WithMessage("Setting key cannot exceed 100 characters")
            .Matches(@"^[A-Za-z0-9_.-]+$").WithMessage("Setting key can only contain letters, numbers, dots, hyphens, and underscores");

        RuleFor(x => x.SettingName)
            .NotEmpty().WithMessage("Setting name is required")
            .MaximumLength(200).WithMessage("Setting name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.Category)
            .MaximumLength(100).WithMessage("Category cannot exceed 100 characters");

        RuleFor(x => x.SettingType)
            .NotEmpty().WithMessage("Setting type is required")
            .MaximumLength(50).WithMessage("Setting type cannot exceed 50 characters");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater");
    }
}
