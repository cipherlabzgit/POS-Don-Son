using DMS_Backend.Models.DTOs.Products;
using FluentValidation;

namespace DMS_Backend.Validators.Products;

public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Product code is required")
            .MaximumLength(20).WithMessage("Product code must not exceed 20 characters");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            .MaximumLength(200).WithMessage("Product name must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required");

        RuleFor(x => x.UnitOfMeasureId)
            .NotEmpty().WithMessage("Unit of measure is required");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price must be greater than or equal to 0");

        RuleFor(x => x.DecimalPlaces)
            .InclusiveBetween(0, 4).WithMessage("Decimal places must be between 0 and 4")
            .When(x => x.AllowDecimal);

        RuleFor(x => x.RoundingValue)
            .GreaterThan(0).WithMessage("Rounding value must be greater than 0");
    }
}
