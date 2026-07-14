using DMS_Backend.Models.DTOs.ShowroomOpenStock;
using FluentValidation;

namespace DMS_Backend.Validators.ShowroomOpenStock;

public class UpdateShowroomOpenStockDtoValidator : AbstractValidator<UpdateShowroomOpenStockDto>
{
    public UpdateShowroomOpenStockDtoValidator()
    {
        RuleFor(x => x.StockAsAt)
            .NotEmpty().WithMessage("Stock as at date is required");
    }
}
