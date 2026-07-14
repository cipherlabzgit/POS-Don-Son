using DMS_Backend.Models.DTOs.PosTheme;
using FluentValidation;

namespace DMS_Backend.Validators.PosTheme;

public class UpdatePosThemeConfigDtoValidator : AbstractValidator<UpdatePosThemeConfigDto>
{
    public UpdatePosThemeConfigDtoValidator()
    {
        RuleFor(x => x.ThemeName)
            .MaximumLength(100).WithMessage("Theme name must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.ThemeName));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.PrimaryColor)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Primary color must be a valid hex color (e.g., #C8102E)")
            .When(x => !string.IsNullOrWhiteSpace(x.PrimaryColor));

        RuleFor(x => x.PrimaryLight)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Primary light color must be a valid hex color")
            .When(x => !string.IsNullOrWhiteSpace(x.PrimaryLight));

        RuleFor(x => x.PrimaryDark)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Primary dark color must be a valid hex color")
            .When(x => !string.IsNullOrWhiteSpace(x.PrimaryDark));

        RuleFor(x => x.AccentColor)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Accent color must be a valid hex color (e.g., #FFD100)")
            .When(x => !string.IsNullOrWhiteSpace(x.AccentColor));

        RuleFor(x => x.AccentLight)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Accent light color must be a valid hex color")
            .When(x => !string.IsNullOrWhiteSpace(x.AccentLight));

        RuleFor(x => x.AccentDark)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Accent dark color must be a valid hex color")
            .When(x => !string.IsNullOrWhiteSpace(x.AccentDark));

        RuleFor(x => x.CategoryColors)
            .Must(colors => colors == null || colors.Count == 0 || colors.Count == 8)
            .WithMessage("Category colors must contain exactly 8 colors or be empty")
            .When(x => x.CategoryColors != null);

        RuleForEach(x => x.CategoryColors)
            .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Each category color must be a valid hex color")
            .When(x => x.CategoryColors != null && x.CategoryColors.Count > 0);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be non-negative")
            .When(x => x.DisplayOrder.HasValue);
    }
}
