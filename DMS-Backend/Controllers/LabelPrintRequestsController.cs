using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.LabelPrintRequests;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/label-print-requests")]
public class LabelPrintRequestsController : ControllerBase
{
    private readonly ILabelPrintRequestService _labelPrintRequestService;
    private readonly ApplicationDbContext _context;

    public LabelPrintRequestsController(
        ILabelPrintRequestService labelPrintRequestService,
        ApplicationDbContext context)
    {
        _labelPrintRequestService = labelPrintRequestService;
        _context = context;
    }

    [HttpGet]
    [HasPermission("operation:label-printing:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (labelPrintRequests, totalCount) = await _labelPrintRequestService.GetAllAsync(
            page, pageSize, fromDate, toDate, productId, status, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            LabelPrintRequests = labelPrintRequests,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:label-printing:view")]
    public async Task<ActionResult<ApiResponse<LabelPrintRequestDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var labelPrintRequest = await _labelPrintRequestService.GetByIdAsync(id, cancellationToken);
        if (labelPrintRequest == null)
        {
            return NotFound(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                Error.NotFound("LabelPrintRequest", id.ToString())));
        }

        return Ok(ApiResponse<LabelPrintRequestDetailDto>.SuccessResponse(labelPrintRequest));
    }

    [HttpPost]
    [HasPermission("operation:label-printing:create")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<LabelPrintRequestDetailDto>>> Create(
        [FromBody] CreateLabelPrintRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var labelPrintRequest = await _labelPrintRequestService.CreateAsync(dto, userId, permissions, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = labelPrintRequest.Id },
                ApiResponse<LabelPrintRequestDetailDto>.SuccessResponse(labelPrintRequest));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:label-printing:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<LabelPrintRequestDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateLabelPrintRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelPrintRequest = await _labelPrintRequestService.UpdateAsync(id, dto, userId, cancellationToken);

            if (labelPrintRequest == null)
            {
                return NotFound(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                    Error.NotFound("LabelPrintRequest", id.ToString())));
            }

            return Ok(ApiResponse<LabelPrintRequestDetailDto>.SuccessResponse(labelPrintRequest));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:label-printing:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _labelPrintRequestService.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailureResponse(
                    Error.NotFound("LabelPrintRequest", id.ToString())));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Label print request deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("operation:label-printing:update")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<LabelPrintRequestDetailDto>>> Submit(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var req = await _labelPrintRequestService.SubmitAsync(id, userId, cancellationToken);

            if (req == null)
            {
                return NotFound(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                    Error.NotFound("LabelPrintRequest", id.ToString())));
            }

            return Ok(ApiResponse<LabelPrintRequestDetailDto>.SuccessResponse(req));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:label-printing:approve")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<LabelPrintRequestDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelPrintRequest = await _labelPrintRequestService.ApproveAsync(id, userId, cancellationToken);

            if (labelPrintRequest == null)
            {
                return NotFound(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                    Error.NotFound("LabelPrintRequest", id.ToString())));
            }

            return Ok(ApiResponse<LabelPrintRequestDetailDto>.SuccessResponse(labelPrintRequest));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:label-printing:reject")]
    [Audit]
    [DayLockGuard]
    public async Task<ActionResult<ApiResponse<LabelPrintRequestDetailDto>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelPrintRequest = await _labelPrintRequestService.RejectAsync(id, userId, cancellationToken);

            if (labelPrintRequest == null)
            {
                return NotFound(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                    Error.NotFound("LabelPrintRequest", id.ToString())));
            }

            return Ok(ApiResponse<LabelPrintRequestDetailDto>.SuccessResponse(labelPrintRequest));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LabelPrintRequestDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    /// <summary>
    /// Returns all resolved variable values for a label print request so the frontend
    /// can substitute them into any ZPL template before printing.
    /// </summary>
    [HttpGet("{id:guid}/print-data")]
    [HasPermission("operation:label-printing:view")]
    public async Task<ActionResult<ApiResponse<LabelPrintDataDto>>> GetPrintData(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var req = await _context.LabelPrintRequests
            .Include(r => r.Product)
                .ThenInclude(p => p.Category)
            .Include(r => r.Product)
                .ThenInclude(p => p.UnitOfMeasure)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (req == null)
            return NotFound(ApiResponse<LabelPrintDataDto>.FailureResponse(
                Error.NotFound("LabelPrintRequest", id.ToString())));

        var product = req.Product;
        var effectivePrice = req.PriceOverride ?? product.UnitPrice;
        var expiryDate = req.StartDate.AddDays(req.ExpiryDays);

        var dto = new LabelPrintDataDto
        {
            RequestId   = req.Id,
            DisplayNo   = req.DisplayNo,
            LabelCount  = req.LabelCount,

            ProductName = product.Name,
            ProductCode = product.Code,
            Barcode     = product.Code, // product code is the barcode value
            Category    = product.Category?.Name ?? string.Empty,
            Uom         = product.UnitOfMeasure?.Code ?? string.Empty,

            Price       = $"Rs. {effectivePrice:N2}",
            Mrp         = $"Rs. {product.UnitPrice:N2}",
            PriceList   = string.Empty,

            PrintDate   = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            StartDate   = req.StartDate.ToString("yyyy-MM-dd"),
            ExpiryDate  = expiryDate.ToString("yyyy-MM-dd"),
            ExpiryDays  = req.ExpiryDays,

            Outlet      = string.Empty,
            CompanyName = "Don & Sons (Pvt) Ltd",
        };

        return Ok(ApiResponse<LabelPrintDataDto>.SuccessResponse(dto));
    }
}
