using AutoMapper;
using DMS_Backend.Models.DTOs.RoundingRules;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class RoundingRuleProfile : Profile
{
    public RoundingRuleProfile()
    {
        CreateMap<RoundingRule, RoundingRuleListDto>();

        CreateMap<RoundingRule, RoundingRuleDetailDto>();

        CreateMap<RoundingRuleCreateDto, RoundingRule>();
        
        CreateMap<RoundingRuleUpdateDto, RoundingRule>();
    }
}
