using AutoMapper;
using DMS_Backend.Models.DTOs.Products;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class ProductProfile : Profile
{
    public ProductProfile()
    {
        CreateMap<Product, ProductListItemDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.UnitOfMeasure, opt => opt.MapFrom(src => src.UnitOfMeasure != null ? src.UnitOfMeasure.Code : string.Empty))
            .ForMember(dest => dest.SectionAssignments, opt => opt.MapFrom(src => src.SectionAssignments));

        CreateMap<Product, ProductDetailDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.UnitOfMeasure, opt => opt.MapFrom(src => src.UnitOfMeasure != null ? src.UnitOfMeasure.Code : string.Empty))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSectionRef != null ? src.ProductionSectionRef.Name : null))
            .ForMember(dest => dest.SectionAssignments, opt => opt.MapFrom(src => src.SectionAssignments))
            .ForMember(dest => dest.LabelPrintUom, opt => opt.MapFrom(src => src.LabelPrintUom != null ? src.LabelPrintUom.Code : null))
            .ForMember(dest => dest.LabelIngredients, opt => opt.MapFrom(src => src.LabelIngredients.OrderBy(i => i.SortOrder)))
            .ForMember(dest => dest.LabelTemplateCode, opt => opt.MapFrom(src => src.LabelTemplate != null ? src.LabelTemplate.Code : null))
            .ForMember(dest => dest.LabelTemplateName, opt => opt.MapFrom(src => src.LabelTemplate != null ? src.LabelTemplate.Name : null));

        CreateMap<ProductSectionAssignment, ProductSectionAssignmentDto>()
            .ForMember(dest => dest.ProductionSectionCode, opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Code : string.Empty))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Name : string.Empty));

        CreateMap<ProductLabelIngredient, ProductLabelIngredientDto>()
            .ForMember(dest => dest.IngredientCode, opt => opt.MapFrom(src => src.Ingredient != null ? src.Ingredient.Code : string.Empty))
            .ForMember(dest => dest.IngredientName, opt => opt.MapFrom(src => src.Ingredient != null ? src.Ingredient.Name : string.Empty));

        // Ignore collections on map — handled manually in service
        CreateMap<CreateProductDto, Product>()
            .ForMember(dest => dest.SectionAssignments, opt => opt.Ignore())
            .ForMember(dest => dest.LabelIngredients, opt => opt.Ignore());
        CreateMap<UpdateProductDto, Product>()
            .ForMember(dest => dest.SectionAssignments, opt => opt.Ignore())
            .ForMember(dest => dest.LabelIngredients, opt => opt.Ignore());
    }
}
