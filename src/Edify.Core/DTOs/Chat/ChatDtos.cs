using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Chat;

// Response DTOs
public class ChatRoomResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int MemberCount { get; set; }
    public ChatMessageResponseDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
}

public class ChatMessageResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderInitials { get; set; } = string.Empty;
    public bool IsTeacher { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public int? ReplyToMessageId { get; set; }
    public ChatMessageResponseDto? ReplyToMessage { get; set; }
    public bool IsOwnMessage { get; set; }
}

// Create/Update DTOs
public class SendMessageDto
{
    [Required]
    public int ChatRoomId { get; set; }
    
    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
    
    public int? ReplyToMessageId { get; set; }
}

public class UpdateMessageDto
{
    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}

// Pagination
public class GetMessagesDto
{
    public int ChatRoomId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public int? BeforeMessageId { get; set; }  // For infinite scroll
}

public class ChatMessagesPageDto
{
    public List<ChatMessageResponseDto> Messages { get; set; } = new();
    public bool HasMore { get; set; }
    public int TotalCount { get; set; }
}


