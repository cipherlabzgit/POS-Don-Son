using AutoMapper;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.StoresIssueNotes;

namespace DMS_Backend.Mapping;

public class StoresIssueNoteProfile : Profile
{
    public StoresIssueNoteProfile()
    {
        CreateMap<StoresIssueNote, StoresIssueNoteDetailDto>()
            .ForMember(dest => dest.ProductionSectionName, 
                opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Name : string.Empty))
            .ForMember(dest => dest.IssuedByName, opt => opt.Ignore())
            .ForMember(dest => dest.ReceivedByName, opt => opt.Ignore());

        CreateMap<StoresIssueNote, StoresIssueNoteListDto>()
            .ForMember(dest => dest.ProductionSectionName, 
                opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Name : string.Empty))
            .ForMember(dest => dest.ItemCount, 
                opt => opt.MapFrom(src => src.StoresIssueNoteItems.Count));

        CreateMap<StoresIssueNoteItem, StoresIssueNoteItemDto>()
            .ForMember(dest => dest.IngredientCode,
                opt => opt.MapFrom(src => src.Ingredient != null ? src.Ingredient.Code : string.Empty))
            .ForMember(dest => dest.IngredientName,
                opt => opt.MapFrom(src => src.Ingredient != null ? src.Ingredient.Name : string.Empty))
            .ForMember(dest => dest.Unit,
                opt => opt.MapFrom(src => src.Ingredient != null && src.Ingredient.UnitOfMeasure != null ? src.Ingredient.UnitOfMeasure.Code : string.Empty))
            .ForMember(dest => dest.ProductCode,
                opt => opt.MapFrom(src => src.Product != null ? src.Product.Code : null))
            .ForMember(dest => dest.ProductName,
                opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : null))
            .ForMember(dest => dest.RecipeComponentName,
                opt => opt.MapFrom(src => src.RecipeComponent != null ? src.RecipeComponent.ComponentName : null));
    }
}
