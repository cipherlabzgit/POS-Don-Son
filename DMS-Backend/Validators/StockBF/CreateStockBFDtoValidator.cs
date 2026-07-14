using DMS_Backend.Models.DTOs.StockBF;
using FluentValidation;

namespace DMS_Backend.Validators.StockBF;

public class CreateStockBFDtoValidator : AbstractValidator<CreateStockBFDto>
{
    public CreateStockBFDtoValidator()
    {
        RuleFor(x => x.BFDate)
            .NotEmpty().WithMessage("BF date is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity must be greater than or equal to 0");
    }
}
