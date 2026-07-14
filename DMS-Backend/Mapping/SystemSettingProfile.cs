using AutoMapper;
using DMS_Backend.Models.DTOs.SystemSettings;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public sealed class SystemSettingProfile : Profile
{
    public SystemSettingProfile()
    {
        CreateMap<SystemSetting, SystemSettingListDto>();
        CreateMap<SystemSetting, SystemSettingDetailDto>();
        CreateMap<CreateSystemSettingDto, SystemSetting>();
        CreateMap<UpdateSystemSettingDto, SystemSetting>();
    }
}
