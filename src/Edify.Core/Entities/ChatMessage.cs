namespace Edify.Core.Entities;

public class ChatMessage : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public int ChatRoomId { get; set; }
    public int SenderId { get; set; }
    public bool IsEdited { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    
    // Optional: Reply to another message
    public int? ReplyToMessageId { get; set; }
    
    // Navigation properties
    public ChatRoom ChatRoom { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public ChatMessage? ReplyToMessage { get; set; }
    public ICollection<ChatMessage> Replies { get; set; } = new List<ChatMessage>();
}

