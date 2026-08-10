using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Products;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [HasPermission("products:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] bool? activeOnly = null,
        [FromQuery] bool? displayInPosOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (products, totalCount) = await _productService.GetAllAsync(page, pageSize, search, categoryId, activeOnly, displayInPosOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            Products = products,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("products:view|pos:sale:view")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var product = await _productService.GetByIdAsync(id, cancellationToken);
        if (product == null)
        {
            return NotFound(ApiResponse<ProductDetailDto>.FailureResponse(Error.NotFound("Product", id.ToString())));
        }

        return Ok(ApiResponse<ProductDetailDto>.SuccessResponse(product));
    }

    [HttpPost]
    [HasPermission("products:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> Create(
        [FromBody] CreateProductDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var product = await _productService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = product.Id },
                ApiResponse<ProductDetailDto>.SuccessResponse(product));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<ProductDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("products:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateProductDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var product = await _productService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<ProductDetailDto>.SuccessResponse(product));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<ProductDetailDto>.FailureResponse(Error.NotFound("Product", id.ToString())));
            }
            return Conflict(ApiResponse<ProductDetailDto>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("products:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _productService.DeleteAsync(id, userId, cancellationToken);

            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Product deleted successfully" }));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<object>.FailureResponse(Error.NotFound("Product", id.ToString())));
            }
            return Conflict(ApiResponse<object>.FailureResponse(Error.Conflict(ex.Message)));
        }
    }
}
