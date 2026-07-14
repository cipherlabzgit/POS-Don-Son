using DMS_Backend.Models.DTOs.StockBF;



namespace DMS_Backend.Services.Interfaces;



public interface IStockBFService

{

    Task<(List<StockBFListDto> StockBFs, int TotalCount)> GetAllAsync(

        int page, int pageSize, DateTime? fromDate, DateTime? toDate,

        Guid? outletId, Guid? productId, string? status,

        Guid requestingUserId,

        bool viewAllRecords,

        bool showPreviousRecords,

        CancellationToken cancellationToken = default);

    Task<(List<StockBFGroupDto> Groups, int TotalCount)> GetAllGroupedAsync(

        int page, int pageSize, DateTime? fromDate, DateTime? toDate,

        Guid? outletId, Guid? productId, string? status,

        Guid requestingUserId,

        bool viewAllRecords,

        bool showPreviousRecords,

        CancellationToken cancellationToken = default);



    Task<StockBFDetailDto?> GetByIdAsync(

        Guid id,

        Guid requestingUserId,

        bool viewAllRecords,

        CancellationToken cancellationToken = default,

        bool ignoreOwnership = false);



    Task<StockBFDetailDto?> GetByBFNoAsync(string bfNo, CancellationToken cancellationToken = default);

    Task<List<StockBFDetailDto>> GetAllByBFNoAsync(string bfNo, CancellationToken cancellationToken = default);



    Task<StockBFDetailDto> CreateAsync(

        CreateStockBFDto dto,

        Guid userId,

        List<string> permissionCodes,

        bool relaxedBfDateRules,

        CancellationToken cancellationToken = default);

    Task<StockBFDetailDto?> SubmitAsync(

        Guid id,

        Guid userId,

        bool viewAllRecords,

        CancellationToken cancellationToken = default);

    Task<List<StockBFDetailDto>> CreateBulkAsync(

        CreateBulkStockBFDto dto,

        Guid userId,

        bool relaxedBfDateRules,

        CancellationToken cancellationToken = default);



    Task<StockBFDetailDto?> UpdateAsync(

        Guid id,

        UpdateStockBFDto dto,

        Guid userId,

        bool viewAllRecords,

        bool relaxedBfDateRules,

        CancellationToken cancellationToken = default);



    Task<StockBFDetailDto?> ApproveAsync(Guid id, Guid approverUserId, CancellationToken cancellationToken = default);



    Task<StockBFDetailDto?> RejectAsync(Guid id, Guid rejectorUserId, CancellationToken cancellationToken = default);



    Task<bool> DeleteAsync(

        Guid id,

        Guid requestingUserId,

        bool viewAllRecords,

        CancellationToken cancellationToken = default);

}


