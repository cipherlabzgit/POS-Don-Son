namespace DMS_Backend.Models.DTOs.LabelPrintingComments;

public sealed class LabelPrintingCommentCreateDto
{
    public string CommentText { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
