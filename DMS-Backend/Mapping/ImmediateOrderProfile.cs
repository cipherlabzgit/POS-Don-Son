using AutoMapper;
using DMS_Backend.Models.DTOs.ImmediateOrders;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class ImmediateOrderProfile : Profile
{
    public ImmediateOrderProfile()
    {
        CreateMap<ImmediateOrder, ImmediateOrderListDto>()
            .ForMember(dest => dest.DeliveryTurnName, opt => opt.MapFrom(src => src.DeliveryTurn!.Name))
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<ImmediateOrder, ImmediateOrderDetailDto>()
            .ForMember(dest => dest.DeliveryTurnName, opt => opt.MapFrom(src => src.DeliveryTurn!.Name))
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<CreateImmediateOrderDto, ImmediateOrder>();
        CreateMap<UpdateImmediateOrderDto, ImmediateOrder>();
    }
}
