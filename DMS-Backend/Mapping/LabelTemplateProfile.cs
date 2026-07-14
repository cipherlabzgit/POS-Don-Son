using AutoMapper;
using DMS_Backend.Models.DTOs.LabelTemplates;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Mapping;

public class LabelTemplateProfile : Profile
{
    public LabelTemplateProfile()
    {
        CreateMap<LabelTemplate, LabelTemplateListDto>()
            .ForMember(d => d.PrinterName, o => o.MapFrom(s => s.LabelPrinter != null ? s.LabelPrinter.Name : null));

        CreateMap<LabelTemplate, LabelTemplateDetailDto>()
            .ForMember(d => d.PrinterName, o => o.MapFrom(s => s.LabelPrinter != null ? s.LabelPrinter.Name : null));

        CreateMap<LabelTemplateCreateDto, LabelTemplate>();
        
        CreateMap<LabelTemplateUpdateDto, LabelTemplate>();
    }
}
