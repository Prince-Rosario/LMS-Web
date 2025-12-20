using Edify.Core.DTOs.Chat;

namespace Edify.Core.Interfaces;

public interface IChatService
{
    // Chat rooms
    Task<ChatRoomResponseDto> GetOrCreateCourseChat(int courseId, int userId);
    Task<IEnumerable<ChatRoomResponseDto>> GetUserChatRoomsAsync(int userId);
    Task<ChatRoomResponseDto> GetChatRoomAsync(int chatRoomId, int userId);
    
    // Messages
    Task<ChatMessageResponseDto> SendMessageAsync(int userId, SendMessageDto messageDto);
    Task<ChatMessageResponseDto> UpdateMessageAsync(int userId, int messageId, UpdateMessageDto updateDto);
    Task DeleteMessageAsync(int userId, int messageId);
    Task<ChatMessagesPageDto> GetMessagesAsync(int userId, GetMessagesDto getDto);
}






