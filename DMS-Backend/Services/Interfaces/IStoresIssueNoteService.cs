using DMS_Backend.Models.DTOs.StoresIssueNotes;

namespace DMS_Backend.Services.Interfaces;

public interface IStoresIssueNoteService
{
    Task<ComputeStoresIssueNoteResponseDto> ComputeStoresIssueNoteAsync(Guid productionPlanId, Guid productionSectionId, CancellationToken cancellationToken = default);
    Task<StoresIssueNoteDetailDto> CreateStoresIssueNoteAsync(CreateStoresIssueNoteDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<StoresIssueNoteDetailDto?> GetStoresIssueNoteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StoresIssueNoteDetailDto?> GetBySectionAsync(Guid productionPlanId, Guid productionSectionId, CancellationToken cancellationToken = default);
    Task<List<StoresIssueNoteListDto>> GetAllStoresIssueNotesAsync(CancellationToken cancellationToken = default);
    Task<StoresIssueNoteDetailDto?> UpdateStoresIssueNoteAsync(Guid id, UpdateStoresIssueNoteDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteStoresIssueNoteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StoresIssueNoteDetailDto?> IssueNoteAsync(Guid id, Guid issuedBy, CancellationToken cancellationToken = default);
    Task<StoresIssueNoteDetailDto?> ReceiveNoteAsync(Guid id, Guid receivedBy, CancellationToken cancellationToken = default);
}
