using AutoMapper;
using DMS_Backend.Models.Entities;
using DMS_Backend.Models.DTOs.ProductionPlans;

namespace DMS_Backend.Mapping;

public class ProductionPlanProfile : Profile
{
    public ProductionPlanProfile()
    {
        CreateMap<ProductionPlan, ProductionPlanDetailDto>();

        CreateMap<ProductionPlan, ProductionPlanListDto>()
            .ForMember(dest => dest.DeliveryPlanName, 
                opt => opt.MapFrom(src => src.DeliveryPlan != null ? $"{src.DeliveryPlan.PlanDate:yyyy-MM-dd}" : string.Empty));

        CreateMap<ProductionPlanItem, ProductionPlanItemDto>()
            .ForMember(dest => dest.ProductionSectionName, 
                opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Name : string.Empty))
            .ForMember(dest => dest.ProductCode, 
                opt => opt.MapFrom(src => src.Product != null ? src.Product.Code : string.Empty))
            .ForMember(dest => dest.ProductName, 
                opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : string.Empty));

        CreateMap<ProductionAdjustment, ProductionAdjustmentDto>()
            .ForMember(dest => dest.AdjustedByName, opt => opt.Ignore());
    }
}
