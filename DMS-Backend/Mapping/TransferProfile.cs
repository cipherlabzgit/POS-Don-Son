using AutoMapper;
using DMS_Backend.Models.DTOs.Transfers;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class TransferProfile : Profile
{
    public TransferProfile()
    {
        CreateMap<Transfer, TransferListDto>()
            .ForMember(dest => dest.FromOutletName, opt => opt.MapFrom(src => src.FromOutlet!.Name))
            .ForMember(dest => dest.ToOutletName, opt => opt.MapFrom(src => src.ToOutlet!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null));

        CreateMap<Transfer, TransferDetailDto>()
            .ForMember(dest => dest.FromOutletName, opt => opt.MapFrom(src => src.FromOutlet!.Name))
            .ForMember(dest => dest.ToOutletName, opt => opt.MapFrom(src => src.ToOutlet!.Name))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedBy != null ? $"{src.CreatedBy.FirstName} {src.CreatedBy.LastName}" : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}" : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

        CreateMap<TransferItem, TransferItemDto>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.Product!.Code))
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product!.Name));

        CreateMap<CreateTransferDto, Transfer>();
        CreateMap<CreateTransferItemDto, TransferItem>();

        CreateMap<UpdateTransferDto, Transfer>();
        CreateMap<UpdateTransferItemDto, TransferItem>();
    }
}
