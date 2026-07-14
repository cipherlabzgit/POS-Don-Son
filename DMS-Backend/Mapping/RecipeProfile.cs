using AutoMapper;
using DMS_Backend.Models.DTOs.Recipes;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class RecipeProfile : Profile
{
    public RecipeProfile()
    {
        CreateMap<Recipe, RecipeListDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.TemplateName, opt => opt.MapFrom(src => src.Template != null ? src.Template.Name : null))
            .ForMember(dest => dest.ComponentCount, opt => opt.MapFrom(src => src.RecipeComponents.Count));

        CreateMap<Recipe, RecipeDetailDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
            .ForMember(dest => dest.TemplateName, opt => opt.MapFrom(src => src.Template != null ? src.Template.Name : null))
            .ForMember(dest => dest.RecipeComponents, opt => opt.MapFrom(src => src.RecipeComponents.OrderBy(c => c.SortOrder)));

        CreateMap<RecipeComponent, RecipeComponentDto>()
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection.Name))
            .ForMember(dest => dest.RecipeIngredients, opt => opt.MapFrom(src => src.RecipeIngredients.OrderBy(i => i.SortOrder)));

        CreateMap<RecipeIngredient, RecipeIngredientDto>()
            .ForMember(dest => dest.IngredientCode, opt => opt.MapFrom(src => src.Ingredient.Code))
            .ForMember(dest => dest.IngredientName, opt => opt.MapFrom(src => src.Ingredient.Name));
    }
}
