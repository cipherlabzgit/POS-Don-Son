using AutoMapper;
using DMS_Backend.Models.DTOs.PosTheme;
using DMS_Backend.Models.Entities;
using System.Text.Json;

namespace DMS_Backend.Mapping;

public class PosThemeConfigProfile : Profile
{
    public PosThemeConfigProfile()
    {
        CreateMap<PosThemeConfig, PosThemeConfigDto>()
            .ForMember(dest => dest.CategoryColors, 
                opt => opt.MapFrom(src => 
                    string.IsNullOrWhiteSpace(src.CategoryColors) 
                        ? null 
                        : JsonSerializer.Deserialize<List<string>>(src.CategoryColors)));
        
        CreateMap<CreatePosThemeConfigDto, PosThemeConfig>()
            .ForMember(dest => dest.CategoryColors, 
                opt => opt.MapFrom(src => 
                    src.CategoryColors == null || src.CategoryColors.Count == 0
                        ? null 
                        : JsonSerializer.Serialize(src.CategoryColors)));
        
        CreateMap<UpdatePosThemeConfigDto, PosThemeConfig>()
            .ForMember(dest => dest.CategoryColors, 
                opt => opt.MapFrom(src => 
                    src.CategoryColors == null || src.CategoryColors.Count == 0
                        ? null 
                        : JsonSerializer.Serialize(src.CategoryColors)))
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}
