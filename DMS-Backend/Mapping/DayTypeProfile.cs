using AutoMapper;
using DMS_Backend.Models.DTOs.DayTypes;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class DayTypeProfile : Profile
{
    public DayTypeProfile()
    {
        CreateMap<DayType, DayTypeListDto>()
            .ForMember(d => d.Color, opt => opt.MapFrom(s => s.ColorCode))
            .ForMember(d => d.Multiplier, opt => opt.MapFrom(s => s.QuantityMultiplier))
            .ForMember(d => d.ApplicableDays, opt => opt.MapFrom(s => s.ApplicableDaysList));

        CreateMap<DayType, DayTypeDetailDto>()
            .ForMember(d => d.Color, opt => opt.MapFrom(s => s.ColorCode))
            .ForMember(d => d.Multiplier, opt => opt.MapFrom(s => s.QuantityMultiplier))
            .ForMember(d => d.ApplicableDays, opt => opt.MapFrom(s => s.ApplicableDaysList));

        CreateMap<CreateDayTypeDto, DayType>()
            .ForMember(d => d.ColorCode, opt => opt.MapFrom(s => s.Color))
            .ForMember(d => d.QuantityMultiplier, opt => opt.MapFrom(s => s.Multiplier))
            .ForMember(d => d.ApplicableDaysList, opt => opt.MapFrom(s => s.ApplicableDays));

        CreateMap<UpdateDayTypeDto, DayType>()
            .ForMember(d => d.ColorCode, opt => opt.MapFrom(s => s.Color))
            .ForMember(d => d.QuantityMultiplier, opt => opt.MapFrom(s => s.Multiplier))
            .ForMember(d => d.ApplicableDaysList, opt => opt.MapFrom(s => s.ApplicableDays));
    }
}
