using AutoMapper;
using DMS_Backend.Models.DTOs.Ingredients;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class IngredientProfile : Profile
{
    public IngredientProfile()
    {
        CreateMap<Ingredient, IngredientListItemDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.UnitOfMeasure, opt => opt.MapFrom(src => src.UnitOfMeasure != null ? src.UnitOfMeasure.Code : string.Empty));

        CreateMap<Ingredient, IngredientDetailDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.UnitOfMeasure, opt => opt.MapFrom(src => src.UnitOfMeasure != null ? src.UnitOfMeasure.Code : string.Empty));

        CreateMap<CreateIngredientDto, Ingredient>();
        CreateMap<UpdateIngredientDto, Ingredient>();
    }
}
