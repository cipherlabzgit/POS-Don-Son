using AutoMapper;
using DMS_Backend.Models.DTOs.WorkflowConfigs;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class WorkflowConfigProfile : Profile
{
    public WorkflowConfigProfile()
    {
        CreateMap<WorkflowConfig, WorkflowConfigListDto>();

        CreateMap<WorkflowConfig, WorkflowConfigDetailDto>();

        CreateMap<WorkflowConfigCreateDto, WorkflowConfig>();
        
        CreateMap<WorkflowConfigUpdateDto, WorkflowConfig>();
    }
}
