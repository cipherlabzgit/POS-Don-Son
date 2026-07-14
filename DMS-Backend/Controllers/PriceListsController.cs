using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.PriceLists;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PriceListsController : ControllerBase
{
    private readonly IPriceListService _priceListService;

    public PriceListsController(IPriceListService priceListService)
    {
        _priceListService = priceListService;
    }

    [HttpGet]
    [HasPermission("pricing:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (priceLists, totalCount) = await _priceListService.GetAllAsync(page, pageSize, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            PriceLists = priceLists,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("pricing:view")]
    public async Task<ActionResult<ApiResponse<PriceListDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var priceList = await _priceListService.GetByIdAsync(id, cancellationToken);
        if (priceList == null)
        {
            return NotFound(ApiResponse<PriceListDetailDto>.FailureResponse(Error.NotFound("PriceList", id.ToString())));
        }

        return Ok(ApiResponse<PriceListDetailDto>.SuccessResponse(priceList));
    }

    [HttpPost]
    [HasPermission("pricing:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PriceListDetailDto>>> Create(
        [FromBody] PriceListCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var priceList = await _priceListService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = priceList.Id },
                ApiResponse<PriceListDetailDto>.SuccessResponse(priceList));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<PriceListDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("pricing:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<PriceListDetailDto>>> Update(
        Guid id,
        [FromBody] PriceListUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var priceList = await _priceListService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<PriceListDetailDto>.SuccessResponse(priceList));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<PriceListDetailDto>.FailureResponse(Error.NotFound("PriceList", id.ToString())));
            }
            return Conflict(ApiResponse<PriceListDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("pricing:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _priceListService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Price list deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("PriceList", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
