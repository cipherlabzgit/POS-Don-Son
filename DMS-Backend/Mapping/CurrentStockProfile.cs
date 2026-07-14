using AutoMapper;
using DMS_Backend.Models.DTOs.CurrentStock;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

/// <summary>
/// AutoMapper profile for CurrentStock computed view.
/// Note: CurrentStock is not a database entity, it's computed on-demand.
/// </summary>
public sealed class CurrentStockProfile : Profile
{
    public CurrentStockProfile()
    {
        // Map Product to CurrentStockDto (base mapping for products)
        CreateMap<Product, CurrentStockDto>()
            .ForMember(dest => dest.ProductId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.OpenBalance, opt => opt.Ignore())
            .ForMember(dest => dest.TodayProduction, opt => opt.Ignore())
            .ForMember(dest => dest.TodayProductionCancelled, opt => opt.Ignore())
            .ForMember(dest => dest.TodayDelivery, opt => opt.Ignore())
            .ForMember(dest => dest.DeliveryCancelled, opt => opt.Ignore())
            .ForMember(dest => dest.DeliveryReturned, opt => opt.Ignore())
            .ForMember(dest => dest.StockAdjustments, opt => opt.Ignore())
            .ForMember(dest => dest.TodayBalance, opt => opt.Ignore());
    }
}
