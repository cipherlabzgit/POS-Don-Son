using AutoMapper;
using DMS_Backend.Models.DTOs.SecurityPolicies;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class SecurityPolicyProfile : Profile
{
    public SecurityPolicyProfile()
    {
        CreateMap<SecurityPolicy, SecurityPolicyListDto>();

        CreateMap<SecurityPolicy, SecurityPolicyDetailDto>();

        CreateMap<SecurityPolicyCreateDto, SecurityPolicy>();
        
        CreateMap<SecurityPolicyUpdateDto, SecurityPolicy>();
    }
}
