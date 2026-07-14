using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.OutletEmployees;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class OutletEmployeeService : IOutletEmployeeService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<OutletEmployeeService> _logger;

    public OutletEmployeeService(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<OutletEmployeeService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(IEnumerable<OutletEmployeeListDto> outletEmployees, int totalCount)> GetAllAsync(
        int page,
        int pageSize,
        Guid? outletId = null,
        Guid? userId = null,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OutletEmployees
            .Include(oe => oe.Outlet)
            .Include(oe => oe.User)
            .AsQueryable();

        if (outletId.HasValue)
        {
            query = query.Where(oe => oe.OutletId == outletId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(oe => oe.UserId == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(oe =>
                oe.Outlet.Name.Contains(search) ||
                oe.User.FirstName.Contains(search) ||
                oe.User.LastName.Contains(search) ||
                (oe.User.Email != null && oe.User.Email.Contains(search)) ||
                (oe.Position != null && oe.Position.Contains(search)));
        }

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(oe => oe.IsActive);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var outletEmployees = await query
            .OrderBy(oe => oe.Outlet.Name)
            .ThenBy(oe => oe.User.FirstName)
            .ThenBy(oe => oe.User.LastName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<OutletEmployeeListDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return (outletEmployees, totalCount);
    }

    public async Task<OutletEmployeeDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var outletEmployee = await _context.OutletEmployees
            .Include(oe => oe.Outlet)
            .Include(oe => oe.User)
            .FirstOrDefaultAsync(oe => oe.Id == id, cancellationToken);

        return outletEmployee == null ? null : _mapper.Map<OutletEmployeeDetailDto>(outletEmployee);
    }

    public async Task<OutletEmployeeDetailDto> CreateAsync(CreateOutletEmployeeDto dto, Guid createdByUserId, CancellationToken cancellationToken = default)
    {
        if (dto.UserId.HasValue)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.Id == dto.UserId.Value, cancellationToken);

            if (!userExists)
            {
                throw new InvalidOperationException($"User with ID '{dto.UserId}' does not exist.");
            }
        }

        var outletExists = await _context.Outlets
            .AnyAsync(o => o.Id == dto.OutletId, cancellationToken);

        if (!outletExists)
        {
            throw new InvalidOperationException($"Outlet with ID '{dto.OutletId}' does not exist.");
        }

        var exists = await _context.OutletEmployees
            .IgnoreQueryFilters()
            .AnyAsync(oe => oe.OutletId == dto.OutletId && oe.EmployeeCode == dto.EmployeeCode, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Employee with this code is already assigned to this outlet.");
        }

        var outletEmployee = _mapper.Map<OutletEmployee>(dto);
        outletEmployee.Id = Guid.NewGuid();
        outletEmployee.CreatedById = createdByUserId;
        outletEmployee.UpdatedById = createdByUserId;
        outletEmployee.CreatedAt = DateTime.UtcNow;
        outletEmployee.UpdatedAt = DateTime.UtcNow;

        _context.OutletEmployees.Add(outletEmployee);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Outlet employee created for outlet {OutletId} and user {UserId}", 
            outletEmployee.OutletId, outletEmployee.UserId);

        return (await GetByIdAsync(outletEmployee.Id, cancellationToken))!;
    }

    public async Task<OutletEmployeeDetailDto> UpdateAsync(Guid id, UpdateOutletEmployeeDto dto, Guid updatedByUserId, CancellationToken cancellationToken = default)
    {
        var outletEmployee = await _context.OutletEmployees.FirstOrDefaultAsync(oe => oe.Id == id, cancellationToken);
        if (outletEmployee == null)
        {
            throw new InvalidOperationException($"Outlet employee with ID '{id}' not found.");
        }

        var exists = await _context.OutletEmployees
            .IgnoreQueryFilters()
            .AnyAsync(oe => oe.Id != id && oe.OutletId == dto.OutletId && oe.EmployeeCode == dto.EmployeeCode, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Employee with this code is already assigned to this outlet.");
        }

        _mapper.Map(dto, outletEmployee);
        outletEmployee.UpdatedById = updatedByUserId;
        outletEmployee.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Outlet employee updated: {Id}", outletEmployee.Id);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var outletEmployee = await _context.OutletEmployees.FirstOrDefaultAsync(oe => oe.Id == id, cancellationToken);
        if (outletEmployee == null)
        {
            throw new InvalidOperationException($"Outlet employee with ID '{id}' not found.");
        }

        outletEmployee.IsActive = false;
        outletEmployee.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Outlet employee soft-deleted: {Id}", outletEmployee.Id);
    }
}
