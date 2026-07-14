using AutoMapper;
using DMS_Backend.Models.DTOs.DeliveryReturns;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DeliveryReturnProfile : Profile
{
    public DeliveryReturnProfile()
    {
        CreateMap<DeliveryReturn, DeliveryReturnListDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null));

        CreateMap<DeliveryReturn, DeliveryReturnDetailDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

        CreateMap<DeliveryReturnItem, DeliveryReturnItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<CreateDeliveryReturnDto, DeliveryReturn>();
        CreateMap<CreateDeliveryReturnItemDto, DeliveryReturnItem>();

        CreateMap<UpdateDeliveryReturnDto, DeliveryReturn>();
        CreateMap<UpdateDeliveryReturnItemDto, DeliveryReturnItem>();
    }
}
