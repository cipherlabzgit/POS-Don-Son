using AutoMapper;
using DMS_Backend.Models.DTOs.ShowroomLabelRequest;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class ShowroomLabelRequestProfile : Profile
{
    public ShowroomLabelRequestProfile()
    {
        CreateMap<ShowroomLabelRequest, ShowroomLabelRequestListDto>()
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? src.UpdatedBy.FullName : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => src.RejectedBy != null ? src.RejectedBy.FullName : null));

        CreateMap<ShowroomLabelRequest, ShowroomLabelRequestDetailDto>()
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? src.UpdatedBy.FullName : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => src.RejectedBy != null ? src.RejectedBy.FullName : null));

        CreateMap<CreateShowroomLabelRequestDto, ShowroomLabelRequest>();
        CreateMap<UpdateShowroomLabelRequestDto, ShowroomLabelRequest>();
    }
}
