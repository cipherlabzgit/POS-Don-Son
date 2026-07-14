using DMS_Backend.Models.DTOs.Deliveries;
using FluentValidation;

namespace DMS_Backend.Validators.Deliveries;

public class UpdateDeliveryDtoValidator : AbstractValidator<UpdateDeliveryDto>
{
    public UpdateDeliveryDtoValidator()
    {
        RuleFor(x => x.DeliveryDate)
            .NotEmpty().WithMessage("Delivery date is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new UpdateDeliveryItemDtoValidator());
    }
}

public class UpdateDeliveryItemDtoValidator : AbstractValidator<UpdateDeliveryItemDto>
{
    public UpdateDeliveryItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Unit price must be greater than or equal to 0");
    }
}
