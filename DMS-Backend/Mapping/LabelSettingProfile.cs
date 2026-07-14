using AutoMapper;
using DMS_Backend.Models.DTOs.LabelSettings;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class LabelSettingProfile : Profile
{
    public LabelSettingProfile()
    {
        CreateMap<LabelSetting, LabelSettingListDto>();

        CreateMap<LabelSetting, LabelSettingDetailDto>();

        CreateMap<LabelSettingCreateDto, LabelSetting>();
        
        CreateMap<LabelSettingUpdateDto, LabelSetting>();
    }
}
