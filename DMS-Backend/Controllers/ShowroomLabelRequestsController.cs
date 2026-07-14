using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ShowroomLabelRequest;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/showroom-label-requests")]
public class ShowroomLabelRequestsController : ControllerBase
{
    private readonly IShowroomLabelRequestService _showroomLabelRequestService;

    public ShowroomLabelRequestsController(IShowroomLabelRequestService showroomLabelRequestService)
    {
        _showroomLabelRequestService = showroomLabelRequestService;
    }

    [HttpGet]
    [HasPermission("operation:showroom-label-printing:view")]
    public async Task<ActionResult<ApiResponse<List<ShowroomLabelRequestListDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? outletId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var requests = await _showroomLabelRequestService.GetAllAsync(
            page, pageSize, outletId, fromDate, toDate, cancellationToken);

        return Ok(ApiResponse<List<ShowroomLabelRequestListDto>>.SuccessResponse(requests));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("operation:showroom-label-printing:view")]
    public async Task<ActionResult<ApiResponse<ShowroomLabelRequestDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var request = await _showroomLabelRequestService.GetByIdAsync(id, cancellationToken);
        
        if (request == null)
        {
            return NotFound(ApiResponse<ShowroomLabelRequestDetailDto>.FailureResponse(
                Error.NotFound("ShowroomLabelRequest", id.ToString())));
        }

        return Ok(ApiResponse<ShowroomLabelRequestDetailDto>.SuccessResponse(request));
    }

    [HttpPost]
    [HasPermission("operation:showroom-label-printing:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ShowroomLabelRequestDetailDto>>> Create(
        [FromBody] CreateShowroomLabelRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var request = await _showroomLabelRequestService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = request.Id },
                ApiResponse<ShowroomLabelRequestDetailDto>.SuccessResponse(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ShowroomLabelRequestDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("operation:showroom-label-printing:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ShowroomLabelRequestDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateShowroomLabelRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var request = await _showroomLabelRequestService.UpdateAsync(id, dto, userId, cancellationToken);

            if (request == null)
            {
                return NotFound(ApiResponse<ShowroomLabelRequestDetailDto>.FailureResponse(
                    Error.NotFound("ShowroomLabelRequest", id.ToString())));
            }

            return Ok(ApiResponse<ShowroomLabelRequestDetailDto>.SuccessResponse(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ShowroomLabelRequestDetailDto>.FailureResponse(
                Error.Validation(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("operation:showroom-label-printing:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var deleted = await _showroomLabelRequestService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("ShowroomLabelRequest", id.ToString())));
        }

        return Ok(ApiResponse<object>.SuccessResponse(
            new { Message = "Showroom label request deleted successfully" }));
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("operation:approvals:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Approve(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _showroomLabelRequestService.ApproveAsync(id, userId, cancellationToken);

        if (!success)
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation("Request not found or is not in Pending status")));

        return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Showroom label request approved" }));
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("operation:approvals:approve")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Reject(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var success = await _showroomLabelRequestService.RejectAsync(id, userId, cancellationToken);

        if (!success)
            return BadRequest(ApiResponse<object>.FailureResponse(
                Error.Validation("Request not found or is not in Pending status")));

        return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Showroom label request rejected" }));
    }
}
