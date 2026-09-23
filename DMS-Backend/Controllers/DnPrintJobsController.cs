using System.Security.Claims;
using DMS_Backend.Common;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DnPrint;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Implementations;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Controllers;

/// <summary>
/// Hybrid DN print queue — web enqueues; WPF DN Print Client polls/claims/prints.
/// </summary>
[ApiController]
[Route("api/dn-print-jobs")]
public sealed class DnPrintJobsController : ControllerBase
{
    public const string ClientKeyHeader = "X-DN-Print-Client-Key";

    private readonly IDnPrintJobService _service;
    private readonly ApplicationDbContext _context;

    public DnPrintJobsController(IDnPrintJobService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    [HttpPost]
    [Authorize]
    [HasPermission("operation:delivery:view")]
    public async Task<ActionResult<ApiResponse<DnPrintJobDetailDto>>> Enqueue(
        [FromBody] EnqueueDnPrintJobDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var (userId, userName) = GetRequester();
            var job = await _service.EnqueueAsync(dto.DeliveryId, dto.StationCode, userId, userName, cancellationToken);
            return Ok(ApiResponse<DnPrintJobDetailDto>.SuccessResponse(job));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DnPrintJobDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("batch")]
    [Authorize]
    [HasPermission("operation:delivery:view")]
    public async Task<ActionResult<ApiResponse<List<DnPrintJobDetailDto>>>> EnqueueBatch(
        [FromBody] EnqueueDnPrintJobsDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.DeliveryIds == null || dto.DeliveryIds.Count == 0)
            return BadRequest(ApiResponse<List<DnPrintJobDetailDto>>.FailureResponse(
                Error.Validation("At least one deliveryId is required.")));

        try
        {
            var (userId, userName) = GetRequester();
            var jobs = await _service.EnqueueManyAsync(dto.DeliveryIds, dto.StationCode, userId, userName, cancellationToken);
            return Ok(ApiResponse<List<DnPrintJobDetailDto>>.SuccessResponse(jobs));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<List<DnPrintJobDetailDto>>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpGet("pending")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<DnPrintJobDetailDto>>>> GetPending(
        [FromQuery] string? stationCode,
        [FromQuery] int take = 10,
        CancellationToken cancellationToken = default)
    {
        if (!await DnPrintClientAuth.ValidateClientKeyAsync(_context, Request, cancellationToken))
            return Unauthorized(ApiResponse<List<DnPrintJobDetailDto>>.FailureResponse(
                Error.Unauthorized("Invalid or missing DN Print Client key.")));

        var jobs = await _service.GetPendingAsync(stationCode, take, cancellationToken);
        return Ok(ApiResponse<List<DnPrintJobDetailDto>>.SuccessResponse(jobs));
    }

    [HttpPost("{id:guid}/claim")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DnPrintJobDetailDto>>> Claim(
        Guid id,
        [FromBody] ClaimDnPrintJobDto dto,
        CancellationToken cancellationToken)
    {
        if (!await DnPrintClientAuth.ValidateClientKeyAsync(_context, Request, cancellationToken))
            return Unauthorized(ApiResponse<DnPrintJobDetailDto>.FailureResponse(
                Error.Unauthorized("Invalid or missing DN Print Client key.")));

        try
        {
            var job = await _service.ClaimAsync(id, dto.StationCode, cancellationToken);
            if (job == null)
                return NotFound(ApiResponse<DnPrintJobDetailDto>.FailureResponse(Error.NotFound("DnPrintJob", id.ToString())));
            return Ok(ApiResponse<DnPrintJobDetailDto>.SuccessResponse(job));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DnPrintJobDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/complete")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DnPrintJobDetailDto>>> Complete(
        Guid id,
        [FromBody] ClaimDnPrintJobDto dto,
        CancellationToken cancellationToken)
    {
        if (!await DnPrintClientAuth.ValidateClientKeyAsync(_context, Request, cancellationToken))
            return Unauthorized(ApiResponse<DnPrintJobDetailDto>.FailureResponse(
                Error.Unauthorized("Invalid or missing DN Print Client key.")));

        try
        {
            var job = await _service.CompleteAsync(id, dto.StationCode, cancellationToken);
            if (job == null)
                return NotFound(ApiResponse<DnPrintJobDetailDto>.FailureResponse(Error.NotFound("DnPrintJob", id.ToString())));
            return Ok(ApiResponse<DnPrintJobDetailDto>.SuccessResponse(job));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<DnPrintJobDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPost("{id:guid}/fail")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DnPrintJobDetailDto>>> Fail(
        Guid id,
        [FromBody] FailDnPrintJobDto dto,
        CancellationToken cancellationToken)
    {
        if (!await DnPrintClientAuth.ValidateClientKeyAsync(_context, Request, cancellationToken))
            return Unauthorized(ApiResponse<DnPrintJobDetailDto>.FailureResponse(
                Error.Unauthorized("Invalid or missing DN Print Client key.")));

        var job = await _service.FailAsync(id, dto.StationCode, dto.ErrorMessage, cancellationToken);
        if (job == null)
            return NotFound(ApiResponse<DnPrintJobDetailDto>.FailureResponse(Error.NotFound("DnPrintJob", id.ToString())));
        return Ok(ApiResponse<DnPrintJobDetailDto>.SuccessResponse(job));
    }

    private (Guid? userId, string userName) GetRequester()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        Guid? userId = Guid.TryParse(idClaim, out var g) ? g : null;
        var name = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("fullName")?.Value
            ?? User.FindFirst(ClaimTypes.Email)?.Value
            ?? "User";
        return (userId, name);
    }
}
