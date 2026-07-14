using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.DailyProductions;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/daily-productions")]
public class DailyProductionsController : ControllerBase
{
    private readonly IDailyProductionService _productionService;

    public DailyProductionsController(IDailyProductionService productionService)
    {
        _productionService = productionService;
    }

    /// <summary>
    /// Non-elevated users may only open details for their own rows created today (Sri Lanka calendar day).
    /// </summary>
    private static bool IsProductionDetailHiddenFromUser(
        DailyProductionDetailDto production,
        Guid userId,
        bool viewAllRecords)
    {
        if (viewAllRecords) return false;
        if (production.CreatedById != userId) return true;
        var (startUtc, endUtc) = SriLankaDisplayTime.GetCurrentSriLankaDayUtcWindow();
        return production.CreatedAt < startUtc || production.CreatedAt >= endUtc;
    }

    [HttpGet]
    [HasPermission("production:daily:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? status = null,
        [FromQuery] bool showPreviousRecords = false,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var viewAll = DailyProductionAuthorization.CanViewAllDailyProductionRecords(User);

        var (productions, totalCount) = await _productionService.GetAllAsync(
            page, pageSize, fromDate, toDate, productId, status,
            userId, viewAll, showPreviousRecords, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Productions = productions,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("production:daily:view")]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var viewAll = DailyProductionAuthorization.CanViewAllDailyProductionRecords(User);
        var production = await _productionService.GetByIdAsync(id, cancellationToken);
        if (production == null || IsProductionDetailHiddenFromUser(production, userId, viewAll))
        {
            return NotFound(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.NotFound("DailyProduction", id.ToString())));
        }

        return Ok(ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
    }

    [HttpGet("by-production-no/{productionNo}")]
    [HasPermission("production:daily:view")]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> GetByProductionNo(
        string productionNo,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var viewAll = DailyProductionAuthorization.CanViewAllDailyProductionRecords(User);
        var production = await _productionService.GetByProductionNoAsync(productionNo, cancellationToken);
        if (production == null || IsProductionDetailHiddenFromUser(production, userId, viewAll))
        {
            return NotFound(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.NotFound("DailyProduction", productionNo)));
        }

        return Ok(ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
    }

    [HttpGet("production-numbers")]
    [HasPermission("production:daily:view")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetProductionNumbers(
        CancellationToken cancellationToken = default)
    {
        var productionNumbers = await _productionService.GetDistinctProductionNumbersAsync(cancellationToken);
        return Ok(ApiResponse<List<string>>.SuccessResponse(productionNumbers));
    }

    [HttpPost]
    [HasPermission("production:daily:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> Create(
        [FromBody] CreateDailyProductionDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            
            // Debug logging
            Console.WriteLine($"[CONTROLLER DEBUG] DailyProductions.Create");
            Console.WriteLine($"  - User ID: {userId}");
            Console.WriteLine($"  - Permissions Count: {permissions.Count}");
            Console.WriteLine($"  - Has auto-approve: {permissions.Contains("production:daily:auto-approve")}");
            
            var production = await _productionService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = production.Id },
                ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("production:daily:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateDailyProductionDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var production = await _productionService.UpdateAsync(id, dto, userId, cancellationToken);

            if (production == null)
            {
                return NotFound(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                    Error.NotFound("DailyProduction", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("production:daily:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _productionService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("DailyProduction", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Daily production deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("production:daily:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var production = await _productionService.SubmitAsync(id, userId, cancellationToken);

            if (production == null)
            {
                return NotFound(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                    Error.NotFound("DailyProduction", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("production:daily:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var production = await _productionService.ApproveAsync(id, userId, cancellationToken);

            if (production == null)
            {
                return NotFound(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                    Error.NotFound("DailyProduction", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("production:daily:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<DailyProductionDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var production = await _productionService.RejectAsync(id, userId, cancellationToken);

            if (production == null)
            {
                return NotFound(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                    Error.NotFound("DailyProduction", id.ToString())));
            }

            return Ok(ApiResponse<DailyProductionDetailDto>.SuccessResponse(production));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DailyProductionDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
