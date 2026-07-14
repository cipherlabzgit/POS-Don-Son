using AutoMapper;
using DMS_Backend.Models.DTOs.StockBF;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class StockBFProfile : Profile
{
    public StockBFProfile()
    {
        CreateMap<StockBF, StockBFListDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}".Trim() : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}".Trim() : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}".Trim() : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => src.RejectedBy != null ? $"{src.RejectedBy.FirstName} {src.RejectedBy.LastName}".Trim() : null));

        CreateMap<StockBF, StockBFDetailDto>()
            .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name))
            .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}".Trim() : null))
            .ForMember(dest => dest.RejectedByName, opt => opt.MapFrom(src => src.RejectedBy != null ? $"{src.RejectedBy.FirstName} {src.RejectedBy.LastName}".Trim() : null))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}".Trim() : null))
            .ForMember(dest => dest.UpdatedByName, opt => opt.MapFrom(src => src.UpdatedBy != null ? $"{src.UpdatedBy.FirstName} {src.UpdatedBy.LastName}".Trim() : null));

        CreateMap<CreateStockBFDto, StockBF>();
        CreateMap<UpdateStockBFDto, StockBF>();
    }
}
