using DMS_Backend.Models.DTOs.UnitOfMeasures;
using FluentValidation;

namespace DMS_Backend.Validators.UnitOfMeasures;

public class CreateUnitOfMeasureDtoValidator : AbstractValidator<CreateUnitOfMeasureDto>
{
    public CreateUnitOfMeasureDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required")
            .MaximumLength(10).WithMessage("Code must not exceed 10 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(100).WithMessage("Description must not exceed 100 characters");
    }
}
