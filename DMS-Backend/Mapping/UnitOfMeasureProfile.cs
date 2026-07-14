using AutoMapper;
using DMS_Backend.Models.DTOs.UnitOfMeasures;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class UnitOfMeasureProfile : Profile
{
    public UnitOfMeasureProfile()
    {
        CreateMap<UnitOfMeasure, UnitOfMeasureListItemDto>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0))
            .ForMember(dest => dest.IngredientCount, opt => opt.MapFrom(src => src.Ingredients != null ? src.Ingredients.Count : 0));

        CreateMap<UnitOfMeasure, UnitOfMeasureDetailDto>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0))
            .ForMember(dest => dest.IngredientCount, opt => opt.MapFrom(src => src.Ingredients != null ? src.Ingredients.Count : 0));

        CreateMap<CreateUnitOfMeasureDto, UnitOfMeasure>();
        CreateMap<UpdateUnitOfMeasureDto, UnitOfMeasure>();
    }
}
