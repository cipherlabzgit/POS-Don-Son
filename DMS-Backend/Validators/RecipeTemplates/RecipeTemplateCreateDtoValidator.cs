using DMS_Backend.Models.DTOs.RecipeTemplates;
using FluentValidation;

namespace DMS_Backend.Validators.RecipeTemplates;

public class RecipeTemplateCreateDtoValidator : AbstractValidator<RecipeTemplateCreateDto>
{
    public RecipeTemplateCreateDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(20).WithMessage("Code must not exceed 20 characters");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));
    }
}
