using AutoMapper;
using DMS_Backend.Models.DTOs.ProductionCancels;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class ProductionCancelProfile : Profile
{
    public ProductionCancelProfile()
    {
        // Map ProductionCancel to ProductionCancelListDto
        CreateMap<ProductionCancel, ProductionCancelListDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.TotalItems, opt => opt.MapFrom(src => src.Lines.Count))
            .ForMember(dest => dest.TotalQty, opt => opt.MapFrom(src => src.Lines.Sum(l => l.CancelledQty)))
            .ForMember(dest => dest.Lines, opt => opt.MapFrom(src => src.Lines))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null));

        // Map ProductionCancel to ProductionCancelDetailDto
        CreateMap<ProductionCancel, ProductionCancelDetailDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.TotalItems, opt => opt.MapFrom(src => src.Lines.Count))
            .ForMember(dest => dest.TotalQty, opt => opt.MapFrom(src => src.Lines.Sum(l => l.CancelledQty)))
            .ForMember(dest => dest.Lines, opt => opt.MapFrom(src => src.Lines))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null));

        // Map ProductionCancelLine to ProductionCancelLineItemDto
        CreateMap<ProductionCancelLine, ProductionCancelLineItemDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name))
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection!.Name));

        // Map CreateProductionCancelDto to ProductionCancel (basic mapping, lines handled in service)
        CreateMap<CreateProductionCancelDto, ProductionCancel>()
            .ForMember(dest => dest.Lines, opt => opt.Ignore());

        // Map UpdateProductionCancelDto to ProductionCancel (basic mapping, lines handled in service)
        CreateMap<UpdateProductionCancelDto, ProductionCancel>()
            .ForMember(dest => dest.Lines, opt => opt.Ignore());

        // Map ProductionCancelLineDto to ProductionCancelLine
        CreateMap<ProductionCancelLineDto, ProductionCancelLine>();
    }
}
