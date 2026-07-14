using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Physical or logical label printer available for template assignment.
/// </summary>
[Table("label_printers")]
public sealed class LabelPrinter : BaseEntity
{
    [Required]
    [MaxLength(200)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("sort_order")]
    public int SortOrder { get; set; }
}
