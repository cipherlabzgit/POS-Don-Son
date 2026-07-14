using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using DMS_Backend.Authorization;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.LabelTemplates;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/label-templates")]
public sealed class LabelTemplatesController : ControllerBase
{
    private readonly ILabelTemplateService _labelTemplateService;
    private readonly IHttpClientFactory _httpClientFactory;

    public LabelTemplatesController(ILabelTemplateService labelTemplateService, IHttpClientFactory httpClientFactory)
    {
        _labelTemplateService = labelTemplateService;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    [HasPermission("label-templates:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (labelTemplates, totalCount) = await _labelTemplateService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            LabelTemplates = labelTemplates,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("label-templates:view")]
    public async Task<ActionResult<ApiResponse<LabelTemplateDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var labelTemplate = await _labelTemplateService.GetByIdAsync(id, cancellationToken);
        if (labelTemplate == null)
        {
            return NotFound(ApiResponse<LabelTemplateDetailDto>.FailureResponse(Error.NotFound("LabelTemplate", id.ToString())));
        }

        return Ok(ApiResponse<LabelTemplateDetailDto>.SuccessResponse(labelTemplate));
    }

    [HttpPost]
    [HasPermission("label-templates:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelTemplateDetailDto>>> Create(
        [FromBody] LabelTemplateCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelTemplate = await _labelTemplateService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = labelTemplate.Id },
                ApiResponse<LabelTemplateDetailDto>.SuccessResponse(labelTemplate));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<LabelTemplateDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}/printer")]
    [HasPermission("label-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelTemplateDetailDto>>> AssignPrinter(
        Guid id,
        [FromBody] AssignLabelTemplatePrinterDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelTemplate = await _labelTemplateService.AssignPrinterAsync(id, dto, userId, cancellationToken);
            return Ok(ApiResponse<LabelTemplateDetailDto>.SuccessResponse(labelTemplate));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(ApiResponse<LabelTemplateDetailDto>.FailureResponse(Error.NotFound("LabelTemplate", id.ToString())));
            }

            return BadRequest(ApiResponse<LabelTemplateDetailDto>.FailureResponse(Error.Validation(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("label-templates:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<LabelTemplateDetailDto>>> Update(
        Guid id,
        [FromBody] LabelTemplateUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var labelTemplate = await _labelTemplateService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<LabelTemplateDetailDto>.SuccessResponse(labelTemplate));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<LabelTemplateDetailDto>.FailureResponse(Error.NotFound("LabelTemplate", id.ToString())));
            }
            return Conflict(ApiResponse<LabelTemplateDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    /// <summary>
    /// Proxies a ZPL snippet to the Labelary API and returns the PNG preview.
    /// Avoids CORS issues when calling labelary.com directly from the browser.
    /// </summary>
    [HttpPost("zpl-preview")]
    [HasPermission("label-templates:view")]
    public async Task<IActionResult> ZplPreview(
        [FromBody] ZplPreviewRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Zpl))
            return BadRequest(ApiResponse<object>.FailureResponse(Error.Validation("ZPL content is required")));

        // Labelary: 8 dpmm = 203dpi, 12 dpmm = 300dpi
        var dpmm = dto.Dpmm is 6 or 8 or 12 or 24 ? dto.Dpmm : 8;
        var widthIn = Math.Max(0.5m, (dto.WidthMm > 0 ? dto.WidthMm : 100m) / 25.4m);
        var heightIn = Math.Max(0.5m, (dto.HeightMm > 0 ? dto.HeightMm : 50m) / 25.4m);

        var url = string.Format(System.Globalization.CultureInfo.InvariantCulture,
            "http://api.labelary.com/v1/printers/{0}dpmm/labels/{1:F2}x{2:F2}/0/",
            dpmm, widthIn, heightIn);

        var client = _httpClientFactory.CreateClient("Labelary");
        var content = new StringContent(dto.Zpl, Encoding.UTF8, "application/x-www-form-urlencoded");
        content.Headers.ContentType = new MediaTypeHeaderValue("application/x-www-form-urlencoded");

        try
        {
            var response = await client.PostAsync(url, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                return StatusCode((int)response.StatusCode,
                    ApiResponse<object>.FailureResponse(Error.Validation($"Labelary error: {errorBody}")));
            }

            var imageBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            return File(imageBytes, "image/png");
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, ApiResponse<object>.FailureResponse(Error.Validation($"Could not reach Labelary service: {ex.Message}")));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("label-templates:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _labelTemplateService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Label template deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("LabelTemplate", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
