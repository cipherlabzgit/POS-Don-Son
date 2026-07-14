using AutoMapper;
using DMS_Backend.Models.DTOs.Auth;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

/// <summary>
/// Base AutoMapper profile. Module-specific profiles should inherit from Profile
/// and be placed in Mapping/<Module>/<Module>Profile.cs
/// </summary>
public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Auth mappings
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src =>
                src.UserRoles.Select(ur => ur.Role)))
            .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src =>
                src.UserRoles
                    .SelectMany(ur => ur.Role.RolePermissions)
                    .Select(rp => rp.Permission.Code)
                    .Distinct()));

        CreateMap<Role, RoleDto>();

        // Add more entity->DTO mappings here or in module-specific profiles
    }
}
