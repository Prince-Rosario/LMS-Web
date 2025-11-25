using System.Security.Claims;
using Edify.Core.DTOs.Chat;
using Edify.Core.Enums;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Edify.API.Hubs;

/// <summary>
/// SignalR Hub for real-time chat functionality
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChatService _chatService;

    // Track user connections: UserId -> List of ConnectionIds
    private static readonly Dictionary<int, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public ChatHub(IUnitOfWork unitOfWork, IChatService chatService)
    {
        _unitOfWork = unitOfWork;
        _chatService = chatService;
    }

    private int GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        
        lock (_lock)
        {
            if (!_userConnections.ContainsKey(userId))
                _userConnections[userId] = new HashSet<string>();
            _userConnections[userId].Add(Context.ConnectionId);
        }

        // Auto-join all chat rooms the user has access to
        await JoinUserChatRooms(userId);
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        
        lock (_lock)
        {
            if (_userConnections.ContainsKey(userId))
            {
                _userConnections[userId].Remove(Context.ConnectionId);
                if (_userConnections[userId].Count == 0)
                    _userConnections.Remove(userId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a specific chat room
    /// </summary>
    public async Task JoinRoom(int chatRoomId)
    {
        var userId = GetUserId();
        
        // Verify access
        if (!await HasChatRoomAccess(userId, chatRoomId))
        {
            await Clients.Caller.SendAsync("Error", "You don't have access to this chat room");
            return;
        }

        var groupName = GetGroupName(chatRoomId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        
        // Notify others that user joined
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        await Clients.OthersInGroup(groupName).SendAsync("UserJoined", new
        {
            UserId = userId,
            UserName = $"{user?.FirstName} {user?.LastName}"
        });
    }

    /// <summary>
    /// Leave a specific chat room
    /// </summary>
    public async Task LeaveRoom(int chatRoomId)
    {
        var userId = GetUserId();
        var groupName = GetGroupName(chatRoomId);
        
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        
        // Notify others that user left
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        await Clients.OthersInGroup(groupName).SendAsync("UserLeft", new
        {
            UserId = userId,
            UserName = $"{user?.FirstName} {user?.LastName}"
        });
    }

    /// <summary>
    /// Send a message to a chat room
    /// </summary>
    public async Task SendMessage(SendMessageDto messageDto)
    {
        var userId = GetUserId();
        
        try
        {
            // Use the existing service to save the message
            var message = await _chatService.SendMessageAsync(userId, messageDto);
            
            // Broadcast to all users in the chat room
            var groupName = GetGroupName(messageDto.ChatRoomId);
            await Clients.Group(groupName).SendAsync("ReceiveMessage", message);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    /// <summary>
    /// Update an existing message
    /// </summary>
    public async Task UpdateMessage(int messageId, string newContent)
    {
        var userId = GetUserId();
        
        try
        {
            var message = await _chatService.UpdateMessageAsync(userId, messageId, new UpdateMessageDto
            {
                Content = newContent
            });
            
            // Get the chat room ID from the message
            var chatMessage = await _unitOfWork.ChatMessages.GetByIdAsync(messageId);
            if (chatMessage != null)
            {
                var groupName = GetGroupName(chatMessage.ChatRoomId);
                await Clients.Group(groupName).SendAsync("MessageUpdated", message);
            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    public async Task DeleteMessage(int messageId)
    {
        var userId = GetUserId();
        
        try
        {
            // Get the chat room ID before deleting
            var chatMessage = await _unitOfWork.ChatMessages.GetByIdAsync(messageId);
            if (chatMessage == null) return;
            
            var chatRoomId = chatMessage.ChatRoomId;
            
            await _chatService.DeleteMessageAsync(userId, messageId);
            
            var groupName = GetGroupName(chatRoomId);
            await Clients.Group(groupName).SendAsync("MessageDeleted", new
            {
                MessageId = messageId,
                ChatRoomId = chatRoomId
            });
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    /// <summary>
    /// Notify that user is typing
    /// </summary>
    public async Task StartTyping(int chatRoomId)
    {
        var userId = GetUserId();
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        var groupName = GetGroupName(chatRoomId);
        await Clients.OthersInGroup(groupName).SendAsync("UserTyping", new
        {
            UserId = userId,
            UserName = $"{user?.FirstName} {user?.LastName}",
            ChatRoomId = chatRoomId
        });
    }

    /// <summary>
    /// Notify that user stopped typing
    /// </summary>
    public async Task StopTyping(int chatRoomId)
    {
        var userId = GetUserId();
        
        var groupName = GetGroupName(chatRoomId);
        await Clients.OthersInGroup(groupName).SendAsync("UserStoppedTyping", new
        {
            UserId = userId,
            ChatRoomId = chatRoomId
        });
    }

    /// <summary>
    /// Get online users in a chat room
    /// </summary>
    public async Task GetOnlineUsers(int chatRoomId)
    {
        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(chatRoomId);
        if (chatRoom == null) return;

        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom.CourseId);
        if (course == null) return;

        var onlineUsers = new List<object>();

        // Check if teacher is online
        lock (_lock)
        {
            if (_userConnections.ContainsKey(course.TeacherId))
            {
                var teacher = _unitOfWork.Users.GetByIdAsync(course.TeacherId).Result;
                if (teacher != null)
                {
                    onlineUsers.Add(new
                    {
                        UserId = teacher.Id,
                        UserName = $"{teacher.FirstName} {teacher.LastName}",
                        IsTeacher = true
                    });
                }
            }
        }

        // Check enrolled students
        var enrollments = await _unitOfWork.Enrollments.FindAsync(
            e => e.CourseId == chatRoom.CourseId && e.Status == EnrollmentStatus.Approved);

        foreach (var enrollment in enrollments)
        {
            lock (_lock)
            {
                if (_userConnections.ContainsKey(enrollment.StudentId))
                {
                    var student = _unitOfWork.Users.GetByIdAsync(enrollment.StudentId).Result;
                    if (student != null)
                    {
                        onlineUsers.Add(new
                        {
                            UserId = student.Id,
                            UserName = $"{student.FirstName} {student.LastName}",
                            IsTeacher = false
                        });
                    }
                }
            }
        }

        await Clients.Caller.SendAsync("OnlineUsers", onlineUsers);
    }

    #region Helper Methods

    private string GetGroupName(int chatRoomId) => $"chat_{chatRoomId}";

    private async Task<bool> HasChatRoomAccess(int userId, int chatRoomId)
    {
        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(chatRoomId);
        if (chatRoom == null || !chatRoom.IsActive) return false;

        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom.CourseId);
        if (course == null) return false;

        // Teacher has access
        if (course.TeacherId == userId) return true;

        // Check if enrolled student
        var enrollment = await _unitOfWork.Enrollments.GetAsync(
            e => e.StudentId == userId && e.CourseId == chatRoom.CourseId && e.Status == EnrollmentStatus.Approved);

        return enrollment != null;
    }

    private async Task JoinUserChatRooms(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) return;

        var courseIds = new List<int>();

        // Get courses where user is teacher
        if (user.CanTeach)
        {
            var teacherCourses = await _unitOfWork.Courses.FindAsync(c => c.TeacherId == userId && c.IsActive);
            courseIds.AddRange(teacherCourses.Select(c => c.Id));
        }

        // Get courses where user is enrolled
        if (user.CanStudy)
        {
            var enrollments = await _unitOfWork.Enrollments.FindAsync(
                e => e.StudentId == userId && e.Status == EnrollmentStatus.Approved);
            courseIds.AddRange(enrollments.Select(e => e.CourseId));
        }

        courseIds = courseIds.Distinct().ToList();

        // Join all chat rooms
        foreach (var courseId in courseIds)
        {
            var chatRoom = await _unitOfWork.ChatRooms.GetAsync(r => r.CourseId == courseId && r.IsActive);
            if (chatRoom != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(chatRoom.Id));
            }
        }
    }

    #endregion
}


