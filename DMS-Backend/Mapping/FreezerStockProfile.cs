using AutoMapper;
using DMS_Backend.Models.DTOs.FreezerStocks;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class FreezerStockProfile : Profile
{
    public FreezerStockProfile()
    {
        CreateMap<FreezerStock, FreezerStockListDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection!.Name));

        CreateMap<FreezerStock, FreezerStockDetailDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection!.Name));

        CreateMap<FreezerStockHistory, FreezerStockHistoryDto>();
        CreateMap<AdjustFreezerStockDto, FreezerStock>();
    }
}
