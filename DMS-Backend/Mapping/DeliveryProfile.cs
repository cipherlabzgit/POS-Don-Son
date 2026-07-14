using AutoMapper;
using DMS_Backend.Models.DTOs.Deliveries;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DeliveryProfile : Profile
{
    public DeliveryProfile()
    {
        CreateMap<Delivery, DeliveryListDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null));

        CreateMap<Delivery, DeliveryDetailDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

        CreateMap<DeliveryItem, DeliveryItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<CreateDeliveryDto, Delivery>();
        CreateMap<CreateDeliveryItemDto, DeliveryItem>()
            .ForMember(dest => dest.Total, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));

        CreateMap<UpdateDeliveryDto, Delivery>();
        CreateMap<UpdateDeliveryItemDto, DeliveryItem>()
            .ForMember(dest => dest.Total, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));
    }
}
