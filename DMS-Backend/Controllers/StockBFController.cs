using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.StockBF;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/stock-bf")]
public class StockBFController : ControllerBase
{
    private readonly IStockBFService _stockBFService;

    public StockBFController(IStockBFService stockBFService)
    {
        _stockBFService = stockBFService;
    }

    [HttpGet]
    [HasPermission("operation:stock-bf:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? outletId = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? status = null,
        [FromQuery] bool showPreviousRecords = false,
        [FromQuery] bool grouped = false,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var viewAll = StockBfAuthorization.CanViewAllStockBfRecords(User);

        if (grouped)
        {
            var (groups, totalCount) = await _stockBFService.GetAllGroupedAsync(
                page, pageSize, fromDate, toDate, outletId, productId, status,
                userId, viewAll, showPreviousRecords, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                Groups = groups,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }));
        }
        else
        {
            var (stockBFs, totalCount) = await _stockBFService.GetAllAsync(
                page, pageSize, fromDate, toDate, outletId, productId, status,
                userId, viewAll, showPreviousRecords, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                StockBFs = stockBFs,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }));
        }
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:stock-bf:view")]
    public async Task<ActionResult<ApiResponse<StockBFDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var viewAll = StockBfAuthorization.CanViewAllStockBfRecords(User);

        var stockBF = await _stockBFService.GetByIdAsync(id, userId, viewAll, cancellationToken);
        if (stockBF == null)
        {
            return NotFound(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.NotFound("StockBF", id.ToString())));
        }

        return Ok(ApiResponse<StockBFDetailDto>.SuccessResponse(stockBF));
    }

    [HttpGet("by-bfno/{bfNo}")]
    [HasPermission("operation:stock-bf:view")]
    public async Task<ActionResult<ApiResponse<List<StockBFDetailDto>>>> GetAllByBFNo(
        string bfNo,
        CancellationToken cancellationToken = default)
    {
        var stockBFs = await _stockBFService.GetAllByBFNoAsync(bfNo, cancellationToken);
        if (stockBFs == null || stockBFs.Count == 0)
        {
            return NotFound(ApiResponse<List<StockBFDetailDto>>.FailureResponse(
                Error.NotFound("StockBF", bfNo)));
        }

        return Ok(ApiResponse<List<StockBFDetailDto>>.SuccessResponse(stockBFs));
    }

    [HttpPost]
    [HasPermission("operation:stock-bf:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockBFDetailDto>>> Create(
        [FromBody] CreateStockBFDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var relaxedDates = StockBfAuthorization.HasRelaxedBfDateRules(User);
            var stockBF = await _stockBFService.CreateAsync(dto, userId, permissions, relaxedDates, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = stockBF.Id },
                ApiResponse<StockBFDetailDto>.SuccessResponse(stockBF));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPost("bulk")]
    [HasPermission("operation:stock-bf:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<List<StockBFDetailDto>>>> CreateBulk(
        [FromBody] CreateBulkStockBFDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var relaxedDates = StockBfAuthorization.HasRelaxedBfDateRules(User);
            var stockBFs = await _stockBFService.CreateBulkAsync(dto, userId, relaxedDates, cancellationToken);

            return Ok(ApiResponse<List<StockBFDetailDto>>.SuccessResponse(stockBFs));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<List<StockBFDetailDto>>.FailureResponse(
                Error.Validation(ex.Message)));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<List<StockBFDetailDto>>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:stock-bf:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockBFDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateStockBFDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var viewAll = StockBfAuthorization.CanViewAllStockBfRecords(User);
            var relaxedDates = StockBfAuthorization.HasRelaxedBfDateRules(User);
            var stockBF = await _stockBFService.UpdateAsync(id, dto, userId, viewAll, relaxedDates, cancellationToken);

            if (stockBF == null)
            {
                return NotFound(ApiResponse<StockBFDetailDto>.FailureResponse(
                    Error.NotFound("StockBF", id.ToString())));
            }

            return Ok(ApiResponse<StockBFDetailDto>.SuccessResponse(stockBF));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:stock-bf:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockBFDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var viewAll = StockBfAuthorization.CanViewAllStockBfRecords(User);
            var stockBF = await _stockBFService.SubmitAsync(id, userId, viewAll, cancellationToken);

            if (stockBF == null)
            {
                return NotFound(ApiResponse<StockBFDetailDto>.FailureResponse(
                    Error.NotFound("StockBF", id.ToString())));
            }

            return Ok(ApiResponse<StockBFDetailDto>.SuccessResponse(stockBF));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:stock-bf:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockBFDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var stockBF = await _stockBFService.ApproveAsync(id, userId, cancellationToken);

            if (stockBF == null)
            {
                return NotFound(ApiResponse<StockBFDetailDto>.FailureResponse(
                    Error.NotFound("StockBF", id.ToString())));
            }

            return Ok(ApiResponse<StockBFDetailDto>.SuccessResponse(stockBF));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:stock-bf:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<StockBFDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var stockBF = await _stockBFService.RejectAsync(id, userId, cancellationToken);

            if (stockBF == null)
            {
                return NotFound(ApiResponse<StockBFDetailDto>.FailureResponse(
                    Error.NotFound("StockBF", id.ToString())));
            }

            return Ok(ApiResponse<StockBFDetailDto>.SuccessResponse(stockBF));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StockBFDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:stock-bf:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var viewAll = StockBfAuthorization.CanViewAllStockBfRecords(User);
            var deleted = await _stockBFService.DeleteAsync(id, userId, viewAll, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("StockBF", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Stock BF deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }
}
