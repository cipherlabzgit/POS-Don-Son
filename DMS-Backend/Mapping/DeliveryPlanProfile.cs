using AutoMapper;
using DMS_Backend.Models.DTOs.DeliveryPlans;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DeliveryPlanProfile : Profile
{
    public DeliveryPlanProfile()
    {
        CreateMap<DeliveryPlan, DeliveryPlanListDto>()
            .ForMember(dest => dest.DeliveryTurnName, opt => opt.MapFrom(src => src.DeliveryTurn!.Name))
            .ForMember(dest => dest.DayTypeName, opt => opt.MapFrom(src => src.DayType!.Name))
            .ForMember(dest => dest.TotalItems, opt => opt.MapFrom(src => src.DeliveryPlanItems.Count));

        CreateMap<DeliveryPlan, DeliveryPlanDetailDto>()
            .ForMember(dest => dest.DeliveryTurnName, opt => opt.MapFrom(src => src.DeliveryTurn!.Name))
            .ForMember(dest => dest.DayTypeName, opt => opt.MapFrom(src => src.DayType!.Name))
            .ForMember(dest => dest.RecipePlanName, opt => opt.MapFrom(src => src.RecipePlan != null ? src.RecipePlan.Name : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.DeliveryPlanItems));

        CreateMap<DeliveryPlanItem, DeliveryPlanItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.WeightVariantLabel, opt => opt.MapFrom(src => src.WeightVariant != null ? src.WeightVariant.Label : null))
            .ForMember(dest => dest.WeightVariantGrams, opt => opt.MapFrom(src => src.WeightVariant != null ? (decimal?)src.WeightVariant.WeightGrams : null));

        CreateMap<CreateDeliveryPlanDto, DeliveryPlan>()
            .ForMember(dest => dest.PlanNo, opt => opt.MapFrom(src => src.PlanNo ?? string.Empty));
        CreateMap<UpdateDeliveryPlanDto, DeliveryPlan>();
        CreateMap<BulkUpsertDeliveryPlanItemDto, DeliveryPlanItem>();
    }
}
