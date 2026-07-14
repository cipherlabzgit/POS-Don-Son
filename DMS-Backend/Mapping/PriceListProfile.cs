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
            .ForMember(dest => dest.ItemCount, opt => opt.MapFrom(src => src.PriceListItems != null ? src.PriceListItems.Count : 0));

        CreateMap<PriceListCreateDto, PriceList>();
        
        CreateMap<PriceListUpdateDto, PriceList>();
    }
}
