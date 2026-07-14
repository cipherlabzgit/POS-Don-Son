using AutoMapper;
using DMS_Backend.Models.DTOs.SectionConsumables;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class SectionConsumableProfile : Profile
{
    public SectionConsumableProfile()
    {
        CreateMap<SectionConsumable, SectionConsumableListDto>()
            .ForMember(dest => dest.ProductionSectionName,
                opt => opt.MapFrom(src => src.ProductionSection.Name))
            .ForMember(dest => dest.IngredientName,
                opt => opt.MapFrom(src => src.Ingredient.Name));

        CreateMap<SectionConsumable, SectionConsumableDetailDto>()
            .ForMember(dest => dest.ProductionSectionName,
                opt => opt.MapFrom(src => src.ProductionSection.Name))
            .ForMember(dest => dest.IngredientName,
                opt => opt.MapFrom(src => src.Ingredient.Name))
            .ForMember(dest => dest.IngredientCode,
                opt => opt.MapFrom(src => src.Ingredient.Code));

        CreateMap<CreateSectionConsumableDto, SectionConsumable>();
        CreateMap<UpdateSectionConsumableDto, SectionConsumable>();
    }
}
