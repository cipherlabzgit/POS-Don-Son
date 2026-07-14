using System.ComponentModel.DataAnnotations;

namespace DMS_Backend.Models.DTOs.ShowroomLabelRequest;

public sealed class CreateShowroomLabelRequestDto
{
    [Required(ErrorMessage = "Outlet ID is required")]
    public required Guid OutletId { get; set; }

    [Required(ErrorMessage = "Text 1 is required")]
    [MaxLength(100, ErrorMessage = "Text 1 must not exceed 100 characters")]
    public required string Text1 { get; set; }

    [MaxLength(100, ErrorMessage = "Text 2 must not exceed 100 characters")]
    public string? Text2 { get; set; }

    [Required(ErrorMessage = "Label count is required")]
    [Range(1, 1000, ErrorMessage = "Label count must be between 1 and 1000")]
    public required int LabelCount { get; set; }
}
