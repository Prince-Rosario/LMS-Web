namespace Edify.Core.Entities;

public class ChatRoom : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public Course Course { get; set; } = null!;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}


