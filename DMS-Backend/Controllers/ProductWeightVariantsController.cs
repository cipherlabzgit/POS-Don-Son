using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.ProductWeightVariants;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/product-weight-variants")]
[Authorize]
public class ProductWeightVariantsController : ControllerBase
{
    private readonly IProductWeightVariantService _service;

    public ProductWeightVariantsController(IProductWeightVariantService service)
    {
        _service = service;
    }

    [HttpGet("by-product/{productId}")]
    [HasPermission("products:view")]
    public async Task<ActionResult<ApiResponse<List<ProductWeightVariantDto>>>> GetByProduct(
        Guid productId, CancellationToken cancellationToken = default)
    {
        var variants = await _service.GetByProductAsync(productId, cancellationToken);
        return Ok(ApiResponse<List<ProductWeightVariantDto>>.SuccessResponse(variants));
    }

    [HttpGet("{id}")]
    [HasPermission("products:view")]
    public async Task<ActionResult<ApiResponse<ProductWeightVariantDto>>> GetById(
        Guid id, CancellationToken cancellationToken = default)
    {
        var variant = await _service.GetByIdAsync(id, cancellationToken);
        if (variant == null)
            return NotFound(ApiResponse<ProductWeightVariantDto>.FailureResponse(Error.NotFound("ProductWeightVariant", id.ToString())));
        return Ok(ApiResponse<ProductWeightVariantDto>.SuccessResponse(variant));
    }

    [HttpPost]
    [HasPermission("products:create")]
    public async Task<ActionResult<ApiResponse<ProductWeightVariantDto>>> Create(
        [FromBody] CreateProductWeightVariantDto dto, CancellationToken cancellationToken = default)
    {
        var variant = await _service.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = variant.Id },
            ApiResponse<ProductWeightVariantDto>.SuccessResponse(variant));
    }

    [HttpPut("{id}")]
    [HasPermission("products:edit")]
    public async Task<ActionResult<ApiResponse<ProductWeightVariantDto>>> Update(
        Guid id, [FromBody] UpdateProductWeightVariantDto dto, CancellationToken cancellationToken = default)
    {
        var variant = await _service.UpdateAsync(id, dto, cancellationToken);
        if (variant == null)
            return NotFound(ApiResponse<ProductWeightVariantDto>.FailureResponse(Error.NotFound("ProductWeightVariant", id.ToString())));
        return Ok(ApiResponse<ProductWeightVariantDto>.SuccessResponse(variant));
    }

    [HttpDelete("{id}")]
    [HasPermission("products:delete")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(
        Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _service.DeleteAsync(id, cancellationToken);
        if (!result)
            return NotFound(ApiResponse<bool>.FailureResponse(Error.NotFound("ProductWeightVariant", id.ToString())));
        return Ok(ApiResponse<bool>.SuccessResponse(true));
    }

    [HttpPost("{id}/set-default")]
    [HasPermission("products:edit")]
    public async Task<ActionResult<ApiResponse<ProductWeightVariantDto>>> SetDefault(
        Guid id, CancellationToken cancellationToken = default)
    {
        var variant = await _service.SetDefaultAsync(id, cancellationToken);
        if (variant == null)
            return NotFound(ApiResponse<ProductWeightVariantDto>.FailureResponse(Error.NotFound("ProductWeightVariant", id.ToString())));
        return Ok(ApiResponse<ProductWeightVariantDto>.SuccessResponse(variant));
    }
}
