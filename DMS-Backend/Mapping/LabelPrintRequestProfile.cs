using AutoMapper;
using DMS_Backend.Models.DTOs.LabelPrintRequests;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class LabelPrintRequestProfile : Profile
{
    public LabelPrintRequestProfile()
    {
        CreateMap<LabelPrintRequest, LabelPrintRequestListDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => 
                src.Status == LabelPrintStatus.Rejected && src.ApprovedBy != null 
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" 
                    : null))
            .ForMember(dest => dest.RejectedDate, opt => opt.MapFrom(src => 
                src.Status == LabelPrintStatus.Rejected ? src.ApprovedDate : null));

        CreateMap<LabelPrintRequest, LabelPrintRequestDetailDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => 
                src.Status == LabelPrintStatus.Rejected && src.ApprovedBy != null 
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" 
                    : null))
            .ForMember(dest => dest.RejectedDate, opt => opt.MapFrom(src => 
                src.Status == LabelPrintStatus.Rejected ? src.ApprovedDate : null));

        CreateMap<CreateLabelPrintRequestDto, LabelPrintRequest>();
        CreateMap<UpdateLabelPrintRequestDto, LabelPrintRequest>();
    }
}
