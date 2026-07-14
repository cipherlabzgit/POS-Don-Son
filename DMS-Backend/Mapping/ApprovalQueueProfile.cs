using AutoMapper;
using DMS_Backend.Models.DTOs.ApprovalQueue;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class ApprovalQueueProfile : Profile
{
    public ApprovalQueueProfile()
    {
        CreateMap<ApprovalQueue, ApprovalQueueListDto>()
            .ForMember(dest => dest.RequestedByName,
                opt => opt.MapFrom(src => src.RequestedBy.FullName))
            .ForMember(dest => dest.ApprovedByName,
                opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null));

        CreateMap<ApprovalQueue, ApprovalQueueDetailDto>()
            .ForMember(dest => dest.RequestedByName,
                opt => opt.MapFrom(src => src.RequestedBy.FullName))
            .ForMember(dest => dest.RequestedByEmail,
                opt => opt.MapFrom(src => src.RequestedBy.Email))
            .ForMember(dest => dest.ApprovedByName,
                opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null))
            .ForMember(dest => dest.ApprovedByEmail,
                opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.Email : null));

        CreateMap<CreateApprovalQueueDto, ApprovalQueue>();
    }
}
