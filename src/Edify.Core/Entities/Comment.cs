using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class Comment : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    
    // Polymorphic relationship - what this comment is on
    public CommentableType CommentableType { get; set; }
    public int CommentableId { get; set; }  // ID of Material, Test, or TestAttempt
    
    public int AuthorId { get; set; }
    public int? ParentCommentId { get; set; }  // For nested replies
    
    public bool IsEdited { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    
    // Navigation properties
    public User Author { get; set; } = null!;
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}






