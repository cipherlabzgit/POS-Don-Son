using DMS_Backend.Models.DTOs.DeliveryReturns;
using FluentValidation;

namespace DMS_Backend.Validators.DeliveryReturns;

public class UpdateDeliveryReturnDtoValidator : AbstractValidator<UpdateDeliveryReturnDto>
{
    public UpdateDeliveryReturnDtoValidator()
    {
        RuleFor(x => x.ReturnDate)
            .NotEmpty().WithMessage("Return date is required");

        RuleFor(x => x.DeliveryNo)
            .NotEmpty().WithMessage("Delivery number is required")
            .MaximumLength(50).WithMessage("Delivery number must not exceed 50 characters");

        RuleFor(x => x.DeliveredDate)
            .NotEmpty().WithMessage("Delivered date is required");

        RuleFor(x => x.OutletId)
            .NotEmpty().WithMessage("Outlet is required");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new UpdateDeliveryReturnItemDtoValidator());
    }
}

public class UpdateDeliveryReturnItemDtoValidator : AbstractValidator<UpdateDeliveryReturnItemDto>
{
    public UpdateDeliveryReturnItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");
    }
}
