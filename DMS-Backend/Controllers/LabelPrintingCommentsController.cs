using System.Security.Claims;
using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.LabelPrintingComments;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/label-printing-comments")]
public sealed class LabelPrintingCommentsController : ControllerBase
{
    private readonly ILabelPrintingCommentService _service;

    public LabelPrintingCommentsController(ILabelPrintingCommentService service)
    {
        _service = service;
    }

    [HttpGet]
    [HasPermission("label-settings:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] bool activeOnly = false,
        CancellationToken cancellationToken = default)
    {
        var list = await _service.GetAllAsync(activeOnly, cancellationToken);
        return Ok(ApiResponse<object>.SuccessResponse(new { Comments = list, TotalCount = list.Count }));
    }

    [HttpPost]
    [HasPermission("label-settings:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelPrintingCommentListDto>>> Create(
        [FromBody] LabelPrintingCommentCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var row = await _service.CreateAsync(dto, userId, cancellationToken);
            return Ok(ApiResponse<LabelPrintingCommentListDto>.SuccessResponse(row));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LabelPrintingCommentListDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("label-settings:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelPrintingCommentListDto>>> Update(
        Guid id,
        [FromBody] LabelPrintingCommentUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var row = await _service.UpdateAsync(id, dto, userId, cancellationToken);
            return Ok(ApiResponse<LabelPrintingCommentListDto>.SuccessResponse(row));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(ApiResponse<LabelPrintingCommentListDto>.FailureResponse(Error.NotFound("LabelPrintingComment", id.ToString())));
            }

            return BadRequest(ApiResponse<LabelPrintingCommentListDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }
}
