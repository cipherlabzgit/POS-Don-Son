using AutoMapper;
using DMS_Backend.Models.DTOs.DailyProductionPlans;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DailyProductionPlanProfile : Profile
{
    public DailyProductionPlanProfile()
    {
        CreateMap<DailyProductionPlan, DailyProductionPlanListDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? src.UpdatedBy.FullName : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null))
            .ForMember(dest => dest.ApprovedDate, opt => opt.MapFrom(src => src.ApprovedDate));

        CreateMap<DailyProductionPlan, DailyProductionPlanDetailDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.FullName : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? src.UpdatedBy.FullName : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null));

        CreateMap<CreateDailyProductionPlanDto, DailyProductionPlan>();
        CreateMap<UpdateDailyProductionPlanDto, DailyProductionPlan>();
    }
}
