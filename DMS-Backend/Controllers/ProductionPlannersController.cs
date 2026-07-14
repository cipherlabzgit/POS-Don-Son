using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FluentValidation;
using DMS_Backend.Models.DTOs.ProductionPlans;
using DMS_Backend.Services.Interfaces;
using DMS_Backend.Common;
using DMS_Backend.Filters;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/production-planners")]
[Authorize]
public class ProductionPlannersController : ControllerBase
{
    private readonly IProductionPlannerService _productionPlannerService;
    private readonly IValidator<CreateProductionPlanDto> _createValidator;
    private readonly IValidator<UpdateProductionPlanDto> _updateValidator;
    private readonly IValidator<CreateProductionAdjustmentDto> _adjustmentValidator;
    private readonly ILogger<ProductionPlannersController> _logger;

    public ProductionPlannersController(
        IProductionPlannerService productionPlannerService,
        IValidator<CreateProductionPlanDto> createValidator,
        IValidator<UpdateProductionPlanDto> updateValidator,
        IValidator<CreateProductionAdjustmentDto> adjustmentValidator,
        ILogger<ProductionPlannersController> logger)
    {
        _productionPlannerService = productionPlannerService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _adjustmentValidator = adjustmentValidator;
        _logger = logger;
    }

    [HttpPost("compute")]
    [HasPermission("production-planner:create")]
    [Audit]
    public async Task<IActionResult> ComputeProductionPlan(
        [FromQuery] Guid deliveryPlanId,
        [FromQuery] bool useFreezerStock,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _productionPlannerService.ComputeProductionPlanAsync(deliveryPlanId, useFreezerStock, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing production plan for delivery plan {DeliveryPlanId}", deliveryPlanId);
            return StatusCode(500, new { message = "An error occurred while computing production plan" });
        }
    }

    [HttpPost]
    [HasPermission("production-planner:create")]
    [Audit]
    public async Task<IActionResult> CreateProductionPlan([FromBody] CreateProductionPlanDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var plan = await _productionPlannerService.CreateProductionPlanAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetProductionPlanById), new { id = plan.Id }, plan);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating production plan");
            return StatusCode(500, new { message = "An error occurred while creating production plan" });
        }
    }

    [HttpGet("{id}")]
    [HasPermission("production-planner:view")]
    public async Task<IActionResult> GetProductionPlanById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _productionPlannerService.GetProductionPlanByIdAsync(id, cancellationToken);

            if (plan == null)
            {
                return NotFound(new { message = "Production plan not found" });
            }

            return Ok(plan);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting production plan {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving production plan" });
        }
    }

    [HttpGet("by-delivery-plan/{deliveryPlanId}")]
    [HasPermission("production-planner:view")]
    public async Task<IActionResult> GetProductionPlanByDeliveryPlanId(Guid deliveryPlanId, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await _productionPlannerService.GetProductionPlanByDeliveryPlanIdAsync(deliveryPlanId, cancellationToken);

            if (plan == null)
            {
                return NotFound(new { message = "Production plan not found for this delivery plan" });
            }

            return Ok(plan);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting production plan for delivery plan {DeliveryPlanId}", deliveryPlanId);
            return StatusCode(500, new { message = "An error occurred while retrieving production plan" });
        }
    }

    [HttpGet]
    [HasPermission("production-planner:view")]
    public async Task<IActionResult> GetAllProductionPlans(CancellationToken cancellationToken)
    {
        try
        {
            var plans = await _productionPlannerService.GetAllProductionPlansAsync(cancellationToken);
            return Ok(plans);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all production plans");
            return StatusCode(500, new { message = "An error occurred while retrieving production plans" });
        }
    }

    [HttpPut("{id}")]
    [HasPermission("production-planner:update")]
    [Audit]
    public async Task<IActionResult> UpdateProductionPlan(Guid id, [FromBody] UpdateProductionPlanDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var plan = await _productionPlannerService.UpdateProductionPlanAsync(id, dto, cancellationToken);

            if (plan == null)
            {
                return NotFound(new { message = "Production plan not found" });
            }

            return Ok(plan);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating production plan {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating production plan" });
        }
    }

    [HttpDelete("{id}")]
    [HasPermission("production-planner:delete")]
    [Audit]
    public async Task<IActionResult> DeleteProductionPlan(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _productionPlannerService.DeleteProductionPlanAsync(id, cancellationToken);

            if (!result)
            {
                return NotFound(new { message = "Production plan not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting production plan {Id}", id);
            return StatusCode(500, new { message = "An error occurred while deleting production plan" });
        }
    }

    [HttpPost("adjustments")]
    [HasPermission("production-planner:update")]
    [Audit]
    public async Task<IActionResult> ApplyAdjustment([FromBody] CreateProductionAdjustmentDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _adjustmentValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var adjustment = await _productionPlannerService.ApplyAdjustmentAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetProductionPlanById), new { id = dto.ProductionPlanItemId }, adjustment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying adjustment");
            return StatusCode(500, new { message = "An error occurred while applying adjustment" });
        }
    }
}
