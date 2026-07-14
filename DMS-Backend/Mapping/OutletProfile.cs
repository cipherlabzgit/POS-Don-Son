using AutoMapper;
using DMS_Backend.Models.DTOs.Outlets;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class OutletProfile : Profile
{
    public OutletProfile()
    {
        CreateMap<Outlet, OutletListDto>()
            .ForMember(dest => dest.DefaultDeliveryTurnName,
                opt => opt.MapFrom(src => src.DefaultDeliveryTurn != null ? src.DefaultDeliveryTurn.Name : null))
            .ForMember(dest => dest.EmployeeCount,
                opt => opt.MapFrom(src => src.OutletEmployees.Count));

        CreateMap<Outlet, OutletDetailDto>()
            .ForMember(dest => dest.DefaultDeliveryTurnName,
                opt => opt.MapFrom(src => src.DefaultDeliveryTurn != null ? src.DefaultDeliveryTurn.Name : null))
            .ForMember(dest => dest.EmployeeCount,
                opt => opt.MapFrom(src => src.OutletEmployees.Count));

        CreateMap<CreateOutletDto, Outlet>()
            .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address ?? string.Empty));

        CreateMap<UpdateOutletDto, Outlet>()
            .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address ?? string.Empty));
    }
}
