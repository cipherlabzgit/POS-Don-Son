using AutoMapper;
using DMS_Backend.Models.DTOs.PriceLists;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class PriceListProfile : Profile
{
    public PriceListProfile()
    {
        CreateMap<PriceList, PriceListListDto>()
            .ForMember(dest => dest.ItemCount, opt => opt.MapFrom(src => src.PriceListItems != null ? src.PriceListItems.Count : 0))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName ?? src.CreatedBy.FirstName : null));

        CreateMap<PriceList, PriceListDetailDto>()
            .ForMember(dest => dest.ItemCount, opt => opt.MapFrom(src => src.PriceListItems != null ? src.PriceListItems.Count : 0))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName ?? src.CreatedBy.FirstName : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.PriceListItems ?? new List<PriceListItem>()));

        CreateMap<PriceListItem, PriceListItemDetailDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product != null ? src.Product.Code : string.Empty))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : string.Empty))
            .ForMember(dest => dest.PreviousPrice, opt => opt.MapFrom(src => src.PreviousUnitPrice))
            .ForMember(dest => dest.NewPrice, opt => opt.MapFrom(src => src.UnitPrice));

        CreateMap<PriceListCreateDto, PriceList>()
            .ForMember(dest => dest.PriceListItems, opt => opt.Ignore())
            .ForMember(dest => dest.EffectiveTo, opt => opt.Ignore());

        CreateMap<PriceListUpdateDto, PriceList>()
            .ForMember(dest => dest.PriceListItems, opt => opt.Ignore())
            .ForMember(dest => dest.EffectiveTo, opt => opt.Ignore());
    }
}
