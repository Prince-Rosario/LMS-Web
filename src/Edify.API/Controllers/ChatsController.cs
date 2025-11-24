using System.Security.Claims;
using Edify.Core.DTOs.Chat;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

/// <summary>
/// Chat management controller for course group chats
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatsController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatsController(IChatService chatService)
    {
        _chatService = chatService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    /// <summary>
    /// Get or create the chat room for a course
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <returns>Chat room details</returns>
    [HttpGet("course/{courseId}")]
    [ProducesResponseType(typeof(ChatRoomResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChatRoomResponseDto>> GetCourseChat(int courseId)
    {
        var userId = GetUserId();
        var chatRoom = await _chatService.GetOrCreateCourseChat(courseId, userId);
        return Ok(chatRoom);
    }

    /// <summary>
    /// Get all chat rooms for the current user
    /// </summary>
    /// <returns>List of chat rooms</returns>
    [HttpGet("my-chats")]
    [ProducesResponseType(typeof(IEnumerable<ChatRoomResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<ChatRoomResponseDto>>> GetMyChats()
    {
        var userId = GetUserId();
        var chatRooms = await _chatService.GetUserChatRoomsAsync(userId);
        return Ok(chatRooms);
    }

    /// <summary>
    /// Get a specific chat room by ID
    /// </summary>
    /// <param name="chatRoomId">Chat room ID</param>
    /// <returns>Chat room details</returns>
    [HttpGet("{chatRoomId}")]
    [ProducesResponseType(typeof(ChatRoomResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChatRoomResponseDto>> GetChatRoom(int chatRoomId)
    {
        var userId = GetUserId();
        var chatRoom = await _chatService.GetChatRoomAsync(chatRoomId, userId);
        return Ok(chatRoom);
    }

    /// <summary>
    /// Send a message to a chat room
    /// </summary>
    /// <param name="messageDto">Message content and chat room ID</param>
    /// <returns>The sent message</returns>
    [HttpPost("messages")]
    [ProducesResponseType(typeof(ChatMessageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ChatMessageResponseDto>> SendMessage([FromBody] SendMessageDto messageDto)
    {
        var userId = GetUserId();
        var message = await _chatService.SendMessageAsync(userId, messageDto);
        return Ok(message);
    }

    /// <summary>
    /// Update a message (within 15 minutes)
    /// </summary>
    /// <param name="messageId">Message ID</param>
    /// <param name="updateDto">Updated message content</param>
    /// <returns>The updated message</returns>
    [HttpPut("messages/{messageId}")]
    [ProducesResponseType(typeof(ChatMessageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChatMessageResponseDto>> UpdateMessage(int messageId, [FromBody] UpdateMessageDto updateDto)
    {
        var userId = GetUserId();
        var message = await _chatService.UpdateMessageAsync(userId, messageId, updateDto);
        return Ok(message);
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    /// <param name="messageId">Message ID</param>
    [HttpDelete("messages/{messageId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteMessage(int messageId)
    {
        var userId = GetUserId();
        await _chatService.DeleteMessageAsync(userId, messageId);
        return Ok(new { message = "Message deleted successfully" });
    }

    /// <summary>
    /// Get messages from a chat room with pagination
    /// </summary>
    /// <param name="chatRoomId">Chat room ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <param name="beforeMessageId">Get messages before this message ID (for infinite scroll)</param>
    /// <returns>Paginated list of messages</returns>
    [HttpGet("{chatRoomId}/messages")]
    [ProducesResponseType(typeof(ChatMessagesPageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChatMessagesPageDto>> GetMessages(
        int chatRoomId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] int? beforeMessageId = null)
    {
        var userId = GetUserId();
        var messages = await _chatService.GetMessagesAsync(userId, new GetMessagesDto
        {
            ChatRoomId = chatRoomId,
            Page = page,
            PageSize = pageSize,
            BeforeMessageId = beforeMessageId
        });
        return Ok(messages);
    }
}

