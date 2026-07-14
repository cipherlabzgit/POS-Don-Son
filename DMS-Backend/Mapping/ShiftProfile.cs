using AutoMapper;
using DMS_Backend.Models.DTOs.Shifts;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class ShiftProfile : Profile
{
    public ShiftProfile()
    {
        CreateMap<Shift, ShiftDto>();
        CreateMap<CreateShiftDto, Shift>();
        CreateMap<UpdateShiftDto, Shift>();
    }
}
