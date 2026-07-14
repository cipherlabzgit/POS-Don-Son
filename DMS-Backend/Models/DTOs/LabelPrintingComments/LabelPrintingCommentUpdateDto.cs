namespace DMS_Backend.Models.DTOs.LabelPrintingComments;

public sealed class LabelPrintingCommentUpdateDto
{
    public string CommentText { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
