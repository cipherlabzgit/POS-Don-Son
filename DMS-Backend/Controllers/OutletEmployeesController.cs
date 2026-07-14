using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.OutletEmployees;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/outlet-employees")]
public class OutletEmployeesController : ControllerBase
{
    private readonly IOutletEmployeeService _outletEmployeeService;

    public OutletEmployeesController(IOutletEmployeeService outletEmployeeService)
    {
        _outletEmployeeService = outletEmployeeService;
    }

    [HttpGet]
    [HasPermission("employee:view")]
    public async Task<ActionResult<ApiResponse<object>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] Guid? outletId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (outletEmployees, totalCount) = await _outletEmployeeService.GetAllAsync(
            page, pageSize, outletId, userId, search, activeOnly, cancellationToken);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            OutletEmployees = outletEmployees,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("employee:view")]
    public async Task<ActionResult<ApiResponse<OutletEmployeeDetailDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outletEmployee = await _outletEmployeeService.GetByIdAsync(id, cancellationToken);
        if (outletEmployee == null)
        {
            return NotFound(ApiResponse<OutletEmployeeDetailDto>.FailureResponse(
                Error.NotFound("OutletEmployee", id.ToString())));
        }

        return Ok(ApiResponse<OutletEmployeeDetailDto>.SuccessResponse(outletEmployee));
    }

    [HttpPost]
    [HasPermission("employee:create")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OutletEmployeeDetailDto>>> Create(
        [FromBody] CreateOutletEmployeeDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var outletEmployee = await _outletEmployeeService.CreateAsync(dto, userId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { id = outletEmployee.Id },
                ApiResponse<OutletEmployeeDetailDto>.SuccessResponse(outletEmployee));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("does not exist"))
        {
            return NotFound(ApiResponse<OutletEmployeeDetailDto>.FailureResponse(
                Error.NotFound("Resource", ex.Message)));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<OutletEmployeeDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("employee:edit")]
    [Audit]
    public async Task<ActionResult<ApiResponse<OutletEmployeeDetailDto>>> Update(
        Guid id,
        [FromBody] UpdateOutletEmployeeDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var outletEmployee = await _outletEmployeeService.UpdateAsync(id, dto, userId, cancellationToken);

            return Ok(ApiResponse<OutletEmployeeDetailDto>.SuccessResponse(outletEmployee));
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found"))
            {
                return NotFound(ApiResponse<OutletEmployeeDetailDto>.FailureResponse(
                    Error.NotFound("OutletEmployee", id.ToString())));
            }

            return Conflict(ApiResponse<OutletEmployeeDetailDto>.FailureResponse(
                Error.Conflict(ex.Message)));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("employee:delete")]
    [Audit]
    public async Task<ActionResult<ApiResponse<object>>> Delete(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _outletEmployeeService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(new { Message = "Outlet employee deleted successfully" }));
        }
        catch (InvalidOperationException)
        {
            return NotFound(ApiResponse<object>.FailureResponse(
                Error.NotFound("OutletEmployee", id.ToString())));
        }
    }
}
