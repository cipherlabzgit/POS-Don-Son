using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DMS_Backend.Models.Entities;

/// <summary>
/// Predefined comment text that can appear on printed labels.
/// </summary>
[Table("label_printing_comments")]
public sealed class LabelPrintingComment : BaseEntity
{
    [Required]
    [MaxLength(500)]
    [Column("comment_text")]
    public string CommentText { get; set; } = string.Empty;

    [Column("sort_order")]
    public int SortOrder { get; set; }
}
