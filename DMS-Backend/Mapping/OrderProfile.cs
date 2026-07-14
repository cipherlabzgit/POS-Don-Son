using AutoMapper;
using DMS_Backend.Models.DTOs.Orders;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class OrderProfile : Profile
{
    public OrderProfile()
    {
        CreateMap<OrderHeader, OrderListDto>()
            .ForMember(dest => dest.DeliveryPlanNo, opt => opt.MapFrom(src => src.DeliveryPlan != null ? src.DeliveryPlan.PlanNo : null));

        CreateMap<OrderHeader, OrderDetailDto>()
            .ForMember(dest => dest.DeliveryPlanNo, opt => opt.MapFrom(src => src.DeliveryPlan != null ? src.DeliveryPlan.PlanNo : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.DeliveryTurnName, opt => opt.MapFrom(src => src.DeliveryTurn!.Name));

        CreateMap<CreateOrderDto, OrderHeader>();
        CreateMap<UpdateOrderDto, OrderHeader>();
        CreateMap<BulkUpsertOrderItemDto, OrderItem>();
    }
}
