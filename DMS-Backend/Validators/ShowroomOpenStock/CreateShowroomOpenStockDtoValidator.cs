using DMS_Backend.Models.DTOs.ShowroomOpenStock;
using FluentValidation;

namespace DMS_Backend.Validators.ShowroomOpenStock;

public class CreateShowroomOpenStockDtoValidator : AbstractValidator<CreateShowroomOpenStockDto>
{
    public CreateShowroomOpenStockDtoValidator()
    {
        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.StockAsAt)
            .NotEmpty().WithMessage("Stock as at date is required");
    }
}
