using AutoMapper;
using DMS_Backend.Models.DTOs.StockAdjustments;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class StockAdjustmentProfile : Profile
{
    public StockAdjustmentProfile()
    {
        CreateMap<StockAdjustment, StockAdjustmentListDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection!.Name))
            .ForMember(dest => dest.AdjustmentType, opt => opt.MapFrom(src => src.AdjustmentType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedDate, opt => opt.MapFrom(src => src.ApprovedDate));

        CreateMap<StockAdjustment, StockAdjustmentDetailDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection!.Name))
            .ForMember(dest => dest.AdjustmentType, opt => opt.MapFrom(src => src.AdjustmentType.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}" : null));

        CreateMap<CreateStockAdjustmentDto, StockAdjustment>();
        CreateMap<UpdateStockAdjustmentDto, StockAdjustment>();
    }
}
