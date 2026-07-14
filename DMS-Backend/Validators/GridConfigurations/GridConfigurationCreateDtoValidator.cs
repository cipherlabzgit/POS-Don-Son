using DMS_Backend.Models.DTOs.GridConfigurations;
using FluentValidation;

namespace DMS_Backend.Validators.GridConfigurations;

public class GridConfigurationCreateDtoValidator : AbstractValidator<GridConfigurationCreateDto>
{
    public GridConfigurationCreateDtoValidator()
    {
        RuleFor(x => x.GridName)
            .NotEmpty().WithMessage("GridName is required")
            .MaximumLength(100).WithMessage("GridName must not exceed 100 characters");

        RuleFor(x => x.ConfigurationName)
            .MaximumLength(100).WithMessage("ConfigurationName must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.ConfigurationName));

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("PageSize must be greater than 0")
            .LessThanOrEqualTo(1000).WithMessage("PageSize must not exceed 1000")
            .When(x => x.PageSize.HasValue);
    }
}
