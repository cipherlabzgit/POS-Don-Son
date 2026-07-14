using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FluentValidation;
using DMS_Backend.Models.DTOs.Reconciliations;
using DMS_Backend.Services.Interfaces;
using DMS_Backend.Common;
using DMS_Backend.Filters;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/reconciliations")]
[Authorize]
public class ReconciliationsController : ControllerBase
{
    private readonly IReconciliationService _reconciliationService;
    private readonly IValidator<CreateReconciliationDto> _createValidator;
    private readonly IValidator<UpdateReconciliationDto> _updateValidator;
    private readonly IValidator<UpdateActualQuantitiesDto> _updateActualsValidator;
    private readonly ILogger<ReconciliationsController> _logger;

    public ReconciliationsController(
        IReconciliationService reconciliationService,
        IValidator<CreateReconciliationDto> createValidator,
        IValidator<UpdateReconciliationDto> updateValidator,
        IValidator<UpdateActualQuantitiesDto> updateActualsValidator,
        ILogger<ReconciliationsController> logger)
    {
        _reconciliationService = reconciliationService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _updateActualsValidator = updateActualsValidator;
        _logger = logger;
    }

    [HttpPost]
    [HasPermission("reconciliation:perform")]
    [Audit]
    public async Task<IActionResult> CreateReconciliation([FromBody] CreateReconciliationDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var userId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var reconciliation = await _reconciliationService.CreateReconciliationAsync(dto, userId, permissions, cancellationToken);
            return CreatedAtAction(nameof(GetReconciliationById), new { id = reconciliation.Id }, reconciliation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating reconciliation");
            return StatusCode(500, new { message = "An error occurred while creating reconciliation" });
        }
    }

    [HttpGet("{id}")]
    [HasPermission("reconciliation:view")]
    public async Task<IActionResult> GetReconciliationById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var reconciliation = await _reconciliationService.GetReconciliationByIdAsync(id, cancellationToken);

            if (reconciliation == null)
            {
                return NotFound(new { message = "Reconciliation not found" });
            }

            return Ok(reconciliation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reconciliation {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving reconciliation" });
        }
    }

    [HttpGet("by-outlet")]
    [HasPermission("reconciliation:view")]
    public async Task<IActionResult> GetByOutlet(
        [FromQuery] Guid planId,
        [FromQuery] Guid outletId,
        CancellationToken cancellationToken)
    {
        try
        {
            var reconciliation = await _reconciliationService.GetByOutletAsync(planId, outletId, cancellationToken);

            if (reconciliation == null)
            {
                return NotFound(new { message = "Reconciliation not found for this outlet" });
            }

            return Ok(reconciliation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reconciliation for plan {PlanId} and outlet {OutletId}", planId, outletId);
            return StatusCode(500, new { message = "An error occurred while retrieving reconciliation" });
        }
    }

    [HttpGet]
    [HasPermission("reconciliation:view")]
    public async Task<IActionResult> GetAllReconciliations(CancellationToken cancellationToken)
    {
        try
        {
            var reconciliations = await _reconciliationService.GetAllReconciliationsAsync(cancellationToken);
            return Ok(reconciliations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all reconciliations");
            return StatusCode(500, new { message = "An error occurred while retrieving reconciliations" });
        }
    }

    [HttpPut("{id}")]
    [HasPermission("reconciliation:perform")]
    [Audit]
    public async Task<IActionResult> UpdateReconciliation(Guid id, [FromBody] UpdateReconciliationDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var reconciliation = await _reconciliationService.UpdateReconciliationAsync(id, dto, cancellationToken);

            if (reconciliation == null)
            {
                return NotFound(new { message = "Reconciliation not found" });
            }

            return Ok(reconciliation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating reconciliation {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating reconciliation" });
        }
    }

    [HttpDelete("{id}")]
    [HasPermission("reconciliation:perform")]
    [Audit]
    public async Task<IActionResult> DeleteReconciliation(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _reconciliationService.DeleteReconciliationAsync(id, cancellationToken);

            if (!result)
            {
                return NotFound(new { message = "Reconciliation not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting reconciliation {Id}", id);
            return StatusCode(500, new { message = "An error occurred while deleting reconciliation" });
        }
    }

    [HttpPut("{id}/actual-quantities")]
    [HasPermission("reconciliation:perform")]
    [Audit]
    public async Task<IActionResult> UpdateActualQuantities(Guid id, [FromBody] UpdateActualQuantitiesDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _updateActualsValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var reconciliation = await _reconciliationService.UpdateActualQuantitiesAsync(id, dto, cancellationToken);

            if (reconciliation == null)
            {
                return NotFound(new { message = "Reconciliation not found" });
            }

            return Ok(reconciliation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating actual quantities for reconciliation {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating actual quantities" });
        }
    }

    [HttpPost("{id}/submit")]
    [HasPermission("reconciliation:perform")]
    [Audit]
    public async Task<IActionResult> SubmitReconciliation(Guid id, [FromBody] SubmitReconciliationDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var reconciliation = await _reconciliationService.SubmitReconciliationAsync(id, dto.SubmittedBy, cancellationToken);

            if (reconciliation == null)
            {
                return NotFound(new { message = "Reconciliation not found" });
            }

            return Ok(reconciliation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting reconciliation {Id}", id);
            return StatusCode(500, new { message = "An error occurred while submitting reconciliation" });
        }
    }
}
