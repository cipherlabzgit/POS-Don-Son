using AutoMapper;
using DMS_Backend.Models.DTOs.RecipeTemplates;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class RecipeTemplateProfile : Profile
{
    public RecipeTemplateProfile()
    {
        CreateMap<RecipeTemplate, RecipeTemplateListDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null));

        CreateMap<RecipeTemplate, RecipeTemplateDetailDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.Components, opt => opt.MapFrom(src => src.RecipeTemplateComponents));

        CreateMap<RecipeTemplateComponent, RecipeTemplateComponentDto>()
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Name : string.Empty))
            .ForMember(dest => dest.Ingredients, opt => opt.MapFrom(src => src.RecipeTemplateIngredients));

        CreateMap<RecipeTemplateIngredient, RecipeTemplateIngredientDto>()
            .ForMember(dest => dest.IngredientCode, opt => opt.MapFrom(src => src.Ingredient != null ? src.Ingredient.Code : string.Empty))
            .ForMember(dest => dest.IngredientName, opt => opt.MapFrom(src => src.Ingredient != null ? src.Ingredient.Name : string.Empty))
            .ForMember(dest => dest.Unit, opt => opt.MapFrom(src => src.Ingredient != null && src.Ingredient.UnitOfMeasure != null ? src.Ingredient.UnitOfMeasure.Code : string.Empty));

        CreateMap<RecipeTemplateCreateDto, RecipeTemplate>();

        CreateMap<RecipeTemplateUpdateDto, RecipeTemplate>();
    }
}
