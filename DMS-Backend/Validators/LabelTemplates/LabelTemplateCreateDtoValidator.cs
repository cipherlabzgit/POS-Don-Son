using DMS_Backend.Models.DTOs.LabelTemplates;
using FluentValidation;

namespace DMS_Backend.Validators.LabelTemplates;

public class LabelTemplateCreateDtoValidator : AbstractValidator<LabelTemplateCreateDto>
{
    public LabelTemplateCreateDtoValidator()
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

        RuleFor(x => x.TemplateType)
            .MaximumLength(50).WithMessage("TemplateType must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.TemplateType));

        RuleFor(x => x.WidthMm)
            .GreaterThan(0).WithMessage("Width must be greater than 0");

        RuleFor(x => x.HeightMm)
            .GreaterThan(0).WithMessage("Height must be greater than 0");
    }
}
