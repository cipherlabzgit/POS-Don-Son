using DMS_Backend.Models.DTOs.LabelSettings;
using FluentValidation;

namespace DMS_Backend.Validators.LabelSettings;

public class LabelSettingCreateDtoValidator : AbstractValidator<LabelSettingCreateDto>
{
    public LabelSettingCreateDtoValidator()
    {
        RuleFor(x => x.SettingKey)
            .NotEmpty().WithMessage("SettingKey is required")
            .MaximumLength(100).WithMessage("SettingKey must not exceed 100 characters");

        RuleFor(x => x.SettingName)
            .NotEmpty().WithMessage("SettingName is required")
            .MaximumLength(200).WithMessage("SettingName must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Category)
            .MaximumLength(100).WithMessage("Category must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Category));

        RuleFor(x => x.ValueType)
            .NotEmpty().WithMessage("ValueType is required")
            .MaximumLength(50).WithMessage("ValueType must not exceed 50 characters");
    }
}
