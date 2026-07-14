using AutoMapper;
using DMS_Backend.Models.DTOs.Cancellations;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class CancellationProfile : Profile
{
    public CancellationProfile()
    {
        CreateMap<Cancellation, CancellationListDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => 
                src.Status == CancellationStatus.Rejected && src.ApprovedBy != null 
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" 
                    : null))
            .ForMember(dest => dest.RejectedDate, opt => opt.MapFrom(src => 
                src.Status == CancellationStatus.Rejected ? src.ApprovedDate : null));

        CreateMap<Cancellation, CancellationDetailDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => 
                src.Status == CancellationStatus.Rejected && src.ApprovedBy != null 
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" 
                    : null))
            .ForMember(dest => dest.RejectedDate, opt => opt.MapFrom(src => 
                src.Status == CancellationStatus.Rejected ? src.ApprovedDate : null));

        CreateMap<CreateCancellationDto, Cancellation>();
        CreateMap<UpdateCancellationDto, Cancellation>();
    }
}
