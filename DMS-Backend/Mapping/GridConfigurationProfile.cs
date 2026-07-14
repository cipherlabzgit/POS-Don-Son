using AutoMapper;
using DMS_Backend.Models.DTOs.GridConfigurations;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class GridConfigurationProfile : Profile
{
    public GridConfigurationProfile()
    {
        CreateMap<GridConfiguration, GridConfigurationListDto>();

        CreateMap<GridConfiguration, GridConfigurationDetailDto>();

        CreateMap<GridConfigurationCreateDto, GridConfiguration>();
        
        CreateMap<GridConfigurationUpdateDto, GridConfiguration>();
    }
}
