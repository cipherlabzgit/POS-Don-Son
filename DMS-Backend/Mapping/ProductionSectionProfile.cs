using AutoMapper;
using DMS_Backend.Models.DTOs.ProductionSections;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class ProductionSectionProfile : Profile
{
    public ProductionSectionProfile()
    {
        CreateMap<ProductionSection, ProductionSectionListDto>()
            .ForMember(dest => dest.ConsumableCount,
                opt => opt.MapFrom(src => src.SectionConsumables.Count));

        CreateMap<ProductionSection, ProductionSectionDetailDto>()
            .ForMember(dest => dest.ConsumableCount,
                opt => opt.MapFrom(src => src.SectionConsumables.Count));

        CreateMap<CreateProductionSectionDto, ProductionSection>();
        CreateMap<UpdateProductionSectionDto, ProductionSection>();
    }
}
