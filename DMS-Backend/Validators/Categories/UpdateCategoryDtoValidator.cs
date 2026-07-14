using DMS_Backend.Models.DTOs.Categories;
using FluentValidation;

namespace DMS_Backend.Validators.Categories;

public class UpdateCategoryDtoValidator : AbstractValidator<UpdateCategoryDto>
{
    public UpdateCategoryDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(20).WithMessage("Code must not exceed 20 characters")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, numbers, underscores, or hyphens");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));
    }
}
