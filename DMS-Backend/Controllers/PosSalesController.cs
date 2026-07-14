using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.PosSales;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/pos-sales")]
public sealed class PosSalesController : ControllerBase
{
    private readonly IPosSaleService _posSaleService;
    private readonly IPosSaleReceiptService _receiptService;

    public PosSalesController(IPosSaleService posSaleService, IPosSaleReceiptService receiptService)
    {
        _posSaleService = posSaleService;
        _receiptService = receiptService;
    }

    [HttpGet]
    [HasPermission("pos:sale:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] Guid? outletId = null,
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var (soldFrom, soldToExclusive) = PosSaleListQuery.ParseSoldAtRange(startDate, endDate);
        var (sales, totalCount) = await _posSaleService.GetAllAsync(
            page,
            pageSize,
            outletId,
            soldFrom,
            soldToExclusive,
            string.IsNullOrWhiteSpace(search) ? null : search.Trim(),
            string.IsNullOrWhiteSpace(status) ? null : status.Trim(),
            cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Sales = sales,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("pos:sale:view")]
    public async Task<ActionResult<ApiResponse<PosSaleDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var sale = await _posSaleService.GetByIdAsync(id, cancellationToken);
        if (sale == null)
        {
            return NotFound(ApiResponse<PosSaleDetailDto>.FailureResponse(
                Error.NotFound("PosSale", id.ToString())));
        }

        return Ok(ApiResponse<PosSaleDetailDto>.SuccessResponse(sale));
    }

    [HttpPost]
    [HasPermission("pos:sale:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosSaleDetailDto>>> Create(
        [FromBody] CreatePosSaleDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sale = await _posSaleService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = sale.Id },
                ApiResponse<PosSaleDetailDto>.SuccessResponse(sale));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<PosSaleDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("bulk")]
    [HasPermission("pos:sale:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<BulkPosSaleResultDto>>> CreateBulk(
        [FromBody] CreateBulkPosSalesDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _posSaleService.CreateBulkAsync(dto, userId, cancellationToken);

            return Ok(ApiResponse<BulkPosSaleResultDto>.SuccessResponse(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<BulkPosSaleResultDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("pos:sale:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosSaleDetailDto>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sale = await _posSaleService.ApproveAsync(id, userId, cancellationToken);
            if (sale == null)
            {
                return NotFound(ApiResponse<PosSaleDetailDto>.FailureResponse(
                    Error.NotFound("PosSale", id.ToString())));
            }

            return Ok(ApiResponse<PosSaleDetailDto>.SuccessResponse(sale));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<PosSaleDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("pos:sale:reject")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosSaleDetailDto>>> Reject(
        Guid id,
        [FromBody] RejectPosSaleDto? body,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sale = await _posSaleService.RejectAsync(id, userId, body?.Reason, cancellationToken);
            if (sale == null)
            {
                return NotFound(ApiResponse<PosSaleDetailDto>.FailureResponse(
                    Error.NotFound("PosSale", id.ToString())));
            }

            return Ok(ApiResponse<PosSaleDetailDto>.SuccessResponse(sale));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<PosSaleDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/void")]
    [HasPermission("pos:sale:void")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PosSaleDetailDto>>> Void(
        Guid id,
        [FromBody] RejectPosSaleDto? body,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sale = await _posSaleService.VoidAsync(id, userId, body?.Reason, cancellationToken);
            if (sale == null)
            {
                return NotFound(ApiResponse<PosSaleDetailDto>.FailureResponse(
                    Error.NotFound("PosSale", id.ToString())));
            }

            return Ok(ApiResponse<PosSaleDetailDto>.SuccessResponse(sale));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<PosSaleDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpGet("{id:guid}/receipt")]
    [HasPermission("pos:sale:view")]
    public async Task<IActionResult> GetReceipt(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var receipt = await _receiptService.GetReceiptDataAsync(id, cancellationToken);
        if (receipt == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("PosSale", id.ToString())));
        }

        var pdfBytes = _receiptService.GenerateReceiptPdf(receipt);
        return File(pdfBytes, "application/pdf", $"Receipt-{receipt.BillNo}.pdf");
    }
}
