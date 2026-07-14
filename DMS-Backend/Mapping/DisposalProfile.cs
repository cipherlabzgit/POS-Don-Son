using AutoMapper;
using DMS_Backend.Models.DTOs.Disposals;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DisposalProfile : Profile
{
    public DisposalProfile()
    {
        CreateMap<Disposal, DisposalListDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null));

        CreateMap<Disposal, DisposalDetailDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

        CreateMap<DisposalItem, DisposalItemDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<CreateDisposalDto, Disposal>();
        CreateMap<CreateDisposalItemDto, DisposalItem>();

        CreateMap<UpdateDisposalDto, Disposal>();
        CreateMap<UpdateDisposalItemDto, DisposalItem>();
    }
}
