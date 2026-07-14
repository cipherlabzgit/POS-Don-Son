using AutoMapper;
using DMS_Backend.Models.DTOs.OutletEmployees;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class OutletEmployeeProfile : Profile
{
    public OutletEmployeeProfile()
    {
        CreateMap<OutletEmployee, OutletEmployeeListDto>()
            .ForMember(dest => dest.OutletName,
                opt => opt.MapFrom(src => src.Outlet.Name))
            .ForMember(dest => dest.OutletCode,
                opt => opt.MapFrom(src => src.Outlet.Code))
            .ForMember(dest => dest.UserName,
                opt => opt.MapFrom(src => src.FullName ?? $"{src.FirstName} {src.LastName}".Trim()))
            .ForMember(dest => dest.UserEmail,
                opt => opt.MapFrom(src => src.Email));

        CreateMap<OutletEmployee, OutletEmployeeDetailDto>()
            .ForMember(dest => dest.OutletName,
                opt => opt.MapFrom(src => src.Outlet.Name))
            .ForMember(dest => dest.OutletCode,
                opt => opt.MapFrom(src => src.Outlet.Code))
            .ForMember(dest => dest.UserName,
                opt => opt.MapFrom(src => src.FullName ?? $"{src.FirstName} {src.LastName}".Trim()))
            .ForMember(dest => dest.UserEmail,
                opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.Phone,
                opt => opt.MapFrom(src => src.Phone))
            .ForMember(dest => dest.Position,
                opt => opt.MapFrom(src => src.Position))
            .ForMember(dest => dest.Notes,
                opt => opt.MapFrom(src => src.Notes));

        CreateMap<CreateOutletEmployeeDto, OutletEmployee>();
        CreateMap<UpdateOutletEmployeeDto, OutletEmployee>();
    }
}
