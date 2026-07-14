using AutoMapper;
using DMS_Backend.Models.DTOs.DailyProductions;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DailyProductionProfile : Profile
{
    public DailyProductionProfile()
    {
        // Note: DailyProductionListDto is now built manually in the service (with grouping)
        // so we don't need an AutoMapper mapping for it anymore

        CreateMap<DailyProduction, DailyProductionDetailDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ShiftName, opt => opt.MapFrom(src => src.Shift!.Name))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedDate, opt => opt.MapFrom(src => src.ApprovedDate));

        CreateMap<CreateDailyProductionDto, DailyProduction>();
        CreateMap<UpdateDailyProductionDto, DailyProduction>();
    }
}
