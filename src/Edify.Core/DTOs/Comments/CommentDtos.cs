using System.ComponentModel.DataAnnotations;
using Edify.Core.Enums;

namespace Edify.Core.DTOs.Comments;

public class CommentResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public CommentableType CommentableType { get; set; }
    public int CommentableId { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorInitials { get; set; } = string.Empty;
    public bool IsTeacher { get; set; }
    public int? ParentCommentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsOwnComment { get; set; }
    public int ReplyCount { get; set; }
    public List<CommentResponseDto> Replies { get; set; } = new();
}

public class CreateCommentDto
{
    [Required]
    public CommentableType CommentableType { get; set; }
    
    [Required]
    public int CommentableId { get; set; }
    
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
    
    public int? ParentCommentId { get; set; }
}

public class UpdateCommentDto
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}

public class GetCommentsDto
{
    [Required]
    public CommentableType CommentableType { get; set; }
    
    [Required]
    public int CommentableId { get; set; }
    
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool IncludeReplies { get; set; } = true;
}

public class CommentsPageDto
{
    public List<CommentResponseDto> Comments { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore { get; set; }
}

