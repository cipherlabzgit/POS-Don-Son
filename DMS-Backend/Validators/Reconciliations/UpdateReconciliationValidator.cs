using FluentValidation;
using DMS_Backend.Models.DTOs.Reconciliations;

namespace DMS_Backend.Validators.Reconciliations;

public class UpdateReconciliationValidator : AbstractValidator<UpdateReconciliationDto>
{
    public UpdateReconciliationValidator()
    {
    }
}
