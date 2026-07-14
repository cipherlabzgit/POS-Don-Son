using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FluentValidation;
using DMS_Backend.Models.DTOs.StoresIssueNotes;
using DMS_Backend.Services.Interfaces;
using DMS_Backend.Common;
using DMS_Backend.Filters;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/stores-issue-notes")]
[Authorize]
public class StoresIssueNotesController : ControllerBase
{
    private readonly IStoresIssueNoteService _storesIssueNoteService;
    private readonly IValidator<CreateStoresIssueNoteDto> _createValidator;
    private readonly IValidator<UpdateStoresIssueNoteDto> _updateValidator;
    private readonly ILogger<StoresIssueNotesController> _logger;

    public StoresIssueNotesController(
        IStoresIssueNoteService storesIssueNoteService,
        IValidator<CreateStoresIssueNoteDto> createValidator,
        IValidator<UpdateStoresIssueNoteDto> updateValidator,
        ILogger<StoresIssueNotesController> logger)
    {
        _storesIssueNoteService = storesIssueNoteService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    [HttpPost("compute")]
    [HasPermission("stores-issue-note:create")]
    [Audit]
    public async Task<IActionResult> ComputeStoresIssueNote(
        [FromQuery] Guid productionPlanId,
        [FromQuery] Guid productionSectionId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _storesIssueNoteService.ComputeStoresIssueNoteAsync(productionPlanId, productionSectionId, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing stores issue note for production plan {ProductionPlanId} and section {ProductionSectionId}", productionPlanId, productionSectionId);
            return StatusCode(500, new { message = "An error occurred while computing stores issue note" });
        }
    }

    [HttpPost]
    [HasPermission("stores-issue-note:create")]
    [Audit]
    [DayLockGuard]
    public async Task<IActionResult> CreateStoresIssueNote([FromBody] CreateStoresIssueNoteDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var userId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var note = await _storesIssueNoteService.CreateStoresIssueNoteAsync(dto, userId, permissions, cancellationToken);
            return CreatedAtAction(nameof(GetStoresIssueNoteById), new { id = note.Id }, note);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating stores issue note");
            return StatusCode(500, new { message = "An error occurred while creating stores issue note" });
        }
    }

    [HttpGet("{id}")]
    [HasPermission("stores-issue-note:view")]
    public async Task<IActionResult> GetStoresIssueNoteById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var note = await _storesIssueNoteService.GetStoresIssueNoteByIdAsync(id, cancellationToken);

            if (note == null)
            {
                return NotFound(new { message = "Stores issue note not found" });
            }

            return Ok(note);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stores issue note {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving stores issue note" });
        }
    }

    [HttpGet("by-section")]
    [HasPermission("stores-issue-note:view")]
    public async Task<IActionResult> GetBySection(
        [FromQuery] Guid planId,
        [FromQuery] Guid sectionId,
        CancellationToken cancellationToken)
    {
        try
        {
            var note = await _storesIssueNoteService.GetBySectionAsync(planId, sectionId, cancellationToken);

            if (note == null)
            {
                return NotFound(new { message = "Stores issue note not found for this section" });
            }

            return Ok(note);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stores issue note for plan {PlanId} and section {SectionId}", planId, sectionId);
            return StatusCode(500, new { message = "An error occurred while retrieving stores issue note" });
        }
    }

    [HttpGet]
    [HasPermission("stores-issue-note:view")]
    public async Task<IActionResult> GetAllStoresIssueNotes(CancellationToken cancellationToken)
    {
        try
        {
            var notes = await _storesIssueNoteService.GetAllStoresIssueNotesAsync(cancellationToken);
            return Ok(notes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all stores issue notes");
            return StatusCode(500, new { message = "An error occurred while retrieving stores issue notes" });
        }
    }

    [HttpPut("{id}")]
    [HasPermission("stores-issue-note:update")]
    [Audit]
    [DayLockGuard]
    public async Task<IActionResult> UpdateStoresIssueNote(Guid id, [FromBody] UpdateStoresIssueNoteDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors.Select(e => e.ErrorMessage) });
        }

        try
        {
            var note = await _storesIssueNoteService.UpdateStoresIssueNoteAsync(id, dto, cancellationToken);

            if (note == null)
            {
                return NotFound(new { message = "Stores issue note not found" });
            }

            return Ok(note);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating stores issue note {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating stores issue note" });
        }
    }

    [HttpDelete("{id}")]
    [HasPermission("stores-issue-note:delete")]
    [Audit]
    [DayLockGuard]
    public async Task<IActionResult> DeleteStoresIssueNote(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _storesIssueNoteService.DeleteStoresIssueNoteAsync(id, cancellationToken);

            if (!result)
            {
                return NotFound(new { message = "Stores issue note not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting stores issue note {Id}", id);
            return StatusCode(500, new { message = "An error occurred while deleting stores issue note" });
        }
    }

    [HttpPost("{id}/issue")]
    [HasPermission("stores-issue-note:execute")]
    [Audit]
    [DayLockGuard]
    public async Task<IActionResult> IssueNote(Guid id, [FromBody] IssueNoteActionDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var note = await _storesIssueNoteService.IssueNoteAsync(id, dto.UserId, cancellationToken);

            if (note == null)
            {
                return NotFound(new { message = "Stores issue note not found" });
            }

            return Ok(note);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error issuing stores issue note {Id}", id);
            return StatusCode(500, new { message = "An error occurred while issuing stores issue note" });
        }
    }

    [HttpPost("{id}/receive")]
    [HasPermission("stores-issue-note:execute")]
    [Audit]
    [DayLockGuard]
    public async Task<IActionResult> ReceiveNote(Guid id, [FromBody] IssueNoteActionDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var note = await _storesIssueNoteService.ReceiveNoteAsync(id, dto.UserId, cancellationToken);

            if (note == null)
            {
                return NotFound(new { message = "Stores issue note not found" });
            }

            return Ok(note);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error receiving stores issue note {Id}", id);
            return StatusCode(500, new { message = "An error occurred while receiving stores issue note" });
        }
    }
}
