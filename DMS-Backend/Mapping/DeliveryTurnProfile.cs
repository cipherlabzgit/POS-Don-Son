using AutoMapper;
using DMS_Backend.Models.DTOs.DeliveryTurns;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DeliveryTurnProfile : Profile
{
    public DeliveryTurnProfile()
    {
        // Entity → list DTO: DeliveryTime → Time, SortOrder → DisplayOrder
        CreateMap<DeliveryTurn, DeliveryTurnListDto>()
            .ForMember(dest => dest.Time, opt => opt.MapFrom(src => src.DeliveryTime))
            .ForMember(dest => dest.DisplayOrder, opt => opt.MapFrom(src => src.SortOrder))
            .ForMember(dest => dest.SectionTimingsCount, opt => opt.MapFrom(src => src.SectionTimings.Count));

        // Entity → detail DTO: DeliveryTime → Time, SortOrder → DisplayOrder
        CreateMap<DeliveryTurn, DeliveryTurnDetailDto>()
            .ForMember(dest => dest.Time, opt => opt.MapFrom(src => src.DeliveryTime))
            .ForMember(dest => dest.DisplayOrder, opt => opt.MapFrom(src => src.SortOrder))
            .ForMember(dest => dest.SectionTimings, opt => opt.MapFrom(src => src.SectionTimings));

        // Create DTO → entity: Time → DeliveryTime, DisplayOrder → SortOrder
        CreateMap<CreateDeliveryTurnDto, DeliveryTurn>()
            .ForMember(dest => dest.DeliveryTime, opt => opt.MapFrom(src => src.Time))
            .ForMember(dest => dest.SortOrder, opt => opt.MapFrom(src => src.DisplayOrder))
            .ForMember(dest => dest.DisplayOrder, opt => opt.Ignore())
            .ForMember(dest => dest.SectionTimings, opt => opt.MapFrom(src => src.SectionTimings));

        // Update DTO → entity: Time → DeliveryTime, DisplayOrder → SortOrder
        // DisplayOrder on entity is a computed readonly property — ignore it
        // SectionTimings are managed manually in the service to ensure proper EF change-tracking
        CreateMap<UpdateDeliveryTurnDto, DeliveryTurn>()
            .ForMember(dest => dest.DeliveryTime, opt => opt.MapFrom(src => src.Time))
            .ForMember(dest => dest.SortOrder, opt => opt.MapFrom(src => src.DisplayOrder))
            .ForMember(dest => dest.DisplayOrder, opt => opt.Ignore())
            .ForMember(dest => dest.SectionTimings, opt => opt.Ignore());

        CreateMap<DeliveryTurnSectionTiming, DeliveryTurnSectionTimingDto>()
            .ForMember(dest => dest.ProductionSectionName, opt => opt.MapFrom(src => src.ProductionSection != null ? src.ProductionSection.Name : string.Empty));
        CreateMap<CreateDeliveryTurnSectionTimingDto, DeliveryTurnSectionTiming>();
    }
}
