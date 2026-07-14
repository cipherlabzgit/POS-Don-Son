using FluentValidation;
using DMS_Backend.Models.DTOs.Shifts;

namespace DMS_Backend.Validators.Shifts;

public class UpdateShiftDtoValidator : AbstractValidator<UpdateShiftDto>
{
    public UpdateShiftDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Shift name is required")
            .MaximumLength(100).WithMessage("Shift name cannot exceed 100 characters");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Shift code is required")
            .MaximumLength(10).WithMessage("Shift code cannot exceed 10 characters")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Shift code must contain only uppercase letters, numbers, hyphens, and underscores");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required")
            .Must(BeAValidTime).WithMessage("Start time must be between 00:00 and 23:59");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required")
            .Must(BeAValidTime).WithMessage("End time must be between 00:00 and 23:59");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be a non-negative number");
    }

    private bool BeAValidTime(TimeSpan time)
    {
        return time >= TimeSpan.Zero && time < TimeSpan.FromDays(1);
    }
}
