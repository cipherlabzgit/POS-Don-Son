using AutoMapper;
using DMS_Backend.Models.DTOs.Categories;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class CategoryProfile : Profile
{
    public CategoryProfile()
    {
        CreateMap<Category, CategoryListItemDto>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0));

        CreateMap<Category, CategoryDetailDto>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.Products != null ? src.Products.Count : 0));

        CreateMap<CreateCategoryDto, Category>();
        CreateMap<UpdateCategoryDto, Category>();
    }
}
