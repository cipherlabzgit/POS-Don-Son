using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.DeliveryTurns;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class DeliveryTurnService : IDeliveryTurnService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DeliveryTurnService> _logger;

    public DeliveryTurnService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<DeliveryTurnService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<DeliveryTurnListDto> deliveryTurns, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.DeliveryTurns.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(dt =>
                dt.Code.Contains(search) ||
                dt.Name.Contains(search));
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(dt => dt.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var deliveryTurns = await query
            .OrderBy(dt => dt.SortOrder)
            .ThenBy(dt => dt.DeliveryTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<DeliveryTurnListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return (deliveryTurns, totalCount);
    }

    public async Task<DeliveryTurnDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deliveryTurn = await _context.DeliveryTurns
            .Include(dt => dt.SectionTimings)
                .ThenInclude(st => st.ProductionSection)
            .FirstOrDefaultAsync(dt => dt.Id == id, cancellationToken);

        return deliveryTurn == null ? null : _mapper.Map<DeliveryTurnDetailDto>(deliveryTurn);
    }

    public async Task<DeliveryTurnDetailDto> CreateAsync(CreateDeliveryTurnDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CodeExistsAsync(dto.Code, null, cancellationToken))
        {
            throw new InvalidOperationException($"Delivery turn with code '{dto.Code}' already exists.");
        }

        var deliveryTurn = _mapper.Map<DeliveryTurn>(dto);
        deliveryTurn.Id = Guid.NewGuid();
        deliveryTurn.CreatedById = userId;
        deliveryTurn.UpdatedById = userId;
        deliveryTurn.CreatedAt = DateTime.UtcNow;
        deliveryTurn.UpdatedAt = DateTime.UtcNow;

        foreach (var timing in deliveryTurn.SectionTimings)
        {
            timing.Id = Guid.NewGuid();
            timing.DeliveryTurnId = deliveryTurn.Id;
        }

        _context.DeliveryTurns.Add(deliveryTurn);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Delivery turn created: {Code} - {Name}", deliveryTurn.Code, deliveryTurn.Name);

        return (await GetByIdAsync(deliveryTurn.Id, cancellationToken))!;
    }

    public async Task<DeliveryTurnDetailDto> UpdateAsync(Guid id, UpdateDeliveryTurnDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var deliveryTurn = await _context.DeliveryTurns
            .Include(dt => dt.SectionTimings)
            .FirstOrDefaultAsync(dt => dt.Id == id, cancellationToken);

        if (deliveryTurn == null)
        {
            throw new InvalidOperationException($"Delivery turn with ID '{id}' not found.");
        }

        if (await CodeExistsAsync(dto.Code, id, cancellationToken))
        {
            throw new InvalidOperationException($"Delivery turn with code '{dto.Code}' already exists.");
        }

        // Map scalar fields only; SectionTimings handled manually for correct EF change-tracking
        _mapper.Map(dto, deliveryTurn);
        deliveryTurn.UpdatedById = userId;
        deliveryTurn.UpdatedAt = DateTime.UtcNow;

        // Detach existing section timings from the change tracker BEFORE the raw SQL
        // delete. If we leave them tracked, EF will also try to DELETE them in
        // SaveChangesAsync (0 rows affected → DbUpdateConcurrencyException).
        var existingTimings = deliveryTurn.SectionTimings.ToList();
        foreach (var t in existingTimings)
            _context.Entry(t).State = EntityState.Detached;

        deliveryTurn.SectionTimings.Clear();

        // Bypass the global IsActive query filter with raw SQL so the DELETE is not
        // silently filtered to 0 rows, which also causes the concurrency exception.
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM delivery_turn_section_timings WHERE delivery_turn_id = {0}",
            deliveryTurn.Id);

        foreach (var timingDto in dto.SectionTimings)
        {
            var newTiming = _mapper.Map<DeliveryTurnSectionTiming>(timingDto);
            newTiming.Id = Guid.NewGuid();
            newTiming.DeliveryTurnId = deliveryTurn.Id;
            deliveryTurn.SectionTimings.Add(newTiming);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Delivery turn updated: {Code} - {Name}", deliveryTurn.Code, deliveryTurn.Name);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deliveryTurn = await _context.DeliveryTurns.FirstOrDefaultAsync(dt => dt.Id == id, cancellationToken);
        if (deliveryTurn == null)
        {
            throw new InvalidOperationException($"Delivery turn with ID '{id}' not found.");
        }

        deliveryTurn.IsActive = false;
        deliveryTurn.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Delivery turn soft-deleted: {Code} - {Name}", deliveryTurn.Code, deliveryTurn.Name);
    }

    public async Task<bool> CodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.DeliveryTurns.IgnoreQueryFilters().Where(dt => dt.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(dt => dt.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
