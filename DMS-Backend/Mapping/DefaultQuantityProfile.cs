using AutoMapper;
using DMS_Backend.Models.DTOs.DefaultQuantities;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DefaultQuantityProfile : Profile
{
    public DefaultQuantityProfile()
    {
        CreateMap<DefaultQuantity, DefaultQuantityListDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.DayTypeName, opt => opt.MapFrom(src => src.DayType!.Name))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<DefaultQuantity, DefaultQuantityDetailDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.DayTypeName, opt => opt.MapFrom(src => src.DayType!.Name))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<CreateDefaultQuantityDto, DefaultQuantity>();
        CreateMap<UpdateDefaultQuantityDto, DefaultQuantity>();
        CreateMap<BulkUpsertDefaultQuantityDto, DefaultQuantity>();
    }
}
