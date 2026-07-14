using DMS_Backend.Models.DTOs.LabelPrintRequests;
using FluentValidation;

namespace DMS_Backend.Validators.LabelPrintRequests;

public class CreateLabelPrintRequestDtoValidator : AbstractValidator<CreateLabelPrintRequestDto>
{
    public CreateLabelPrintRequestDtoValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.LabelCount)
            .GreaterThan(0).WithMessage("Label count must be greater than 0");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.ExpiryDays)
            .GreaterThan(0).WithMessage("Expiry days must be greater than 0");

        RuleFor(x => x.PriceOverride)
            .GreaterThanOrEqualTo(0).WithMessage("Price override must be greater than or equal to 0")
            .When(x => x.PriceOverride.HasValue);
    }
}
