using AutoMapper;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.Reconciliations;

namespace DMS_Backend.Mapping;

public class ReconciliationProfile : Profile
{
    public ReconciliationProfile()
    {
        CreateMap<Reconciliation, ReconciliationDetailDto>()
            .ForMember(dest => dest.DeliveryPlanName, 
                opt => opt.MapFrom(src => src.DeliveryPlan != null ? $"{src.DeliveryPlan.PlanDate:yyyy-MM-dd}" : string.Empty))
            .ForMember(dest => dest.OutletCode, 
                opt => opt.MapFrom(src => src.Outlet != null ? src.Outlet.Code : string.Empty))
            .ForMember(dest => dest.OutletName, 
                opt => opt.MapFrom(src => src.Outlet != null ? src.Outlet.Name : string.Empty))
            .ForMember(dest => dest.SubmittedByName, opt => opt.Ignore());

        CreateMap<Reconciliation, ReconciliationListDto>()
            .ForMember(dest => dest.DeliveryPlanName, 
                opt => opt.MapFrom(src => src.DeliveryPlan != null ? $"{src.DeliveryPlan.PlanDate:yyyy-MM-dd}" : string.Empty))
            .ForMember(dest => dest.OutletCode, 
                opt => opt.MapFrom(src => src.Outlet != null ? src.Outlet.Code : string.Empty))
            .ForMember(dest => dest.OutletName, 
                opt => opt.MapFrom(src => src.Outlet != null ? src.Outlet.Name : string.Empty))
            .ForMember(dest => dest.ItemCount, 
                opt => opt.MapFrom(src => src.ReconciliationItems.Count))
            .ForMember(dest => dest.VarianceCount, 
                opt => opt.MapFrom(src => src.ReconciliationItems.Count(ri => ri.VarianceType != VarianceType.Match)));

        CreateMap<ReconciliationItem, ReconciliationItemDto>()
            .ForMember(dest => dest.ProductCode, 
                opt => opt.MapFrom(src => src.Product != null ? src.Product.Code : string.Empty))
            .ForMember(dest => dest.ProductName, 
                opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : string.Empty));
    }
}
