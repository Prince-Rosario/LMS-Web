using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Chat;
using Edify.Core.Entities;
using Edify.Core.Enums;
using Edify.Core.Interfaces;

namespace Edify.BLL.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;

    public ChatService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatRoomResponseDto> GetOrCreateCourseChat(int courseId, int userId)
    {
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        if (course == null)
            throw new NotFoundException("Course not found");

        // Check access
        bool isTeacher = course.TeacherId == userId;
        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == courseId && e.Status == EnrollmentStatus.Approved);
            if (enrollment == null)
                throw new UnauthorizedException("You don't have access to this course");
        }

        // Find or create chat room
        var chatRoom = await _unitOfWork.ChatRooms.GetAsync(r => r.CourseId == courseId && r.IsActive);

        if (chatRoom == null)
        {
            chatRoom = new ChatRoom
            {
                Name = $"{course.Title} - Group Chat",
                CourseId = courseId
            };
            await _unitOfWork.ChatRooms.AddAsync(chatRoom);
            await _unitOfWork.SaveChangesAsync();
        }

        return await BuildChatRoomResponse(chatRoom, userId);
    }

    public async Task<IEnumerable<ChatRoomResponseDto>> GetUserChatRoomsAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("User not found");

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

        var chatRooms = new List<ChatRoomResponseDto>();
        foreach (var courseId in courseIds)
        {
            var chatRoom = await _unitOfWork.ChatRooms.GetAsync(r => r.CourseId == courseId && r.IsActive);
            if (chatRoom != null)
            {
                chatRooms.Add(await BuildChatRoomResponse(chatRoom, userId));
            }
        }

        return chatRooms.OrderByDescending(r => r.LastMessage?.CreatedAt ?? r.CreatedAt);
    }

    public async Task<ChatRoomResponseDto> GetChatRoomAsync(int chatRoomId, int userId)
    {
        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(chatRoomId);
        if (chatRoom == null || !chatRoom.IsActive)
            throw new NotFoundException("Chat room not found");

        // Verify access
        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom.CourseId);
        bool isTeacher = course?.TeacherId == userId;
        
        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == chatRoom.CourseId && e.Status == EnrollmentStatus.Approved);
            if (enrollment == null)
                throw new UnauthorizedException("You don't have access to this chat room");
        }

        return await BuildChatRoomResponse(chatRoom, userId);
    }

    private async Task<ChatRoomResponseDto> BuildChatRoomResponse(ChatRoom chatRoom, int userId)
    {
        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom.CourseId);

        // Get last message
        var messages = await _unitOfWork.ChatMessages.FindAsync(
            m => m.ChatRoomId == chatRoom.Id && !m.IsDeleted);
        var lastMessage = messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();

        ChatMessageResponseDto? lastMessageDto = null;
        if (lastMessage != null)
        {
            var sender = await _unitOfWork.Users.GetByIdAsync(lastMessage.SenderId);
            lastMessageDto = new ChatMessageResponseDto
            {
                Id = lastMessage.Id,
                Content = lastMessage.Content,
                SenderId = lastMessage.SenderId,
                SenderName = $"{sender?.FirstName} {sender?.LastName}",
                SenderInitials = $"{sender?.FirstName?[0]}{sender?.LastName?[0]}",
                IsTeacher = course?.TeacherId == lastMessage.SenderId,
                CreatedAt = lastMessage.CreatedAt,
                IsEdited = lastMessage.IsEdited,
                IsDeleted = lastMessage.IsDeleted,
                IsOwnMessage = lastMessage.SenderId == userId
            };
        }

        // Get member count
        var enrollments = await _unitOfWork.Enrollments.FindAsync(
            e => e.CourseId == chatRoom.CourseId && e.Status == EnrollmentStatus.Approved);
        int memberCount = enrollments.Count() + 1; // +1 for teacher

        return new ChatRoomResponseDto
        {
            Id = chatRoom.Id,
            Name = chatRoom.Name,
            CourseId = chatRoom.CourseId,
            CourseName = course?.Title ?? "",
            CreatedAt = chatRoom.CreatedAt,
            MemberCount = memberCount,
            LastMessage = lastMessageDto,
            UnreadCount = 0 // TODO: Implement read tracking
        };
    }

    public async Task<ChatMessageResponseDto> SendMessageAsync(int userId, SendMessageDto messageDto)
    {
        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(messageDto.ChatRoomId);
        if (chatRoom == null || !chatRoom.IsActive)
            throw new NotFoundException("Chat room not found");

        // Verify access
        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom.CourseId);
        bool isTeacher = course?.TeacherId == userId;

        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == chatRoom.CourseId && e.Status == EnrollmentStatus.Approved);
            if (enrollment == null)
                throw new UnauthorizedException("You don't have access to this chat room");
        }

        // Verify reply message if provided
        if (messageDto.ReplyToMessageId.HasValue)
        {
            var replyTo = await _unitOfWork.ChatMessages.GetByIdAsync(messageDto.ReplyToMessageId.Value);
            if (replyTo == null || replyTo.ChatRoomId != chatRoom.Id)
                throw new BadRequestException("Invalid reply message");
        }

        var message = new ChatMessage
        {
            Content = messageDto.Content,
            ChatRoomId = messageDto.ChatRoomId,
            SenderId = userId,
            ReplyToMessageId = messageDto.ReplyToMessageId
        };

        await _unitOfWork.ChatMessages.AddAsync(message);
        await _unitOfWork.SaveChangesAsync();

        return await BuildMessageResponse(message, userId);
    }

    public async Task<ChatMessageResponseDto> UpdateMessageAsync(int userId, int messageId, UpdateMessageDto updateDto)
    {
        var message = await _unitOfWork.ChatMessages.GetByIdAsync(messageId);
        if (message == null || message.IsDeleted)
            throw new NotFoundException("Message not found");

        if (message.SenderId != userId)
            throw new UnauthorizedException("You can only edit your own messages");

        // Only allow editing within 15 minutes
        if ((DateTime.UtcNow - message.CreatedAt).TotalMinutes > 15)
            throw new BadRequestException("Messages can only be edited within 15 minutes");

        message.Content = updateDto.Content;
        message.IsEdited = true;

        await _unitOfWork.ChatMessages.UpdateAsync(message);
        await _unitOfWork.SaveChangesAsync();

        return await BuildMessageResponse(message, userId);
    }

    public async Task DeleteMessageAsync(int userId, int messageId)
    {
        var message = await _unitOfWork.ChatMessages.GetByIdAsync(messageId);
        if (message == null)
            throw new NotFoundException("Message not found");

        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(message.ChatRoomId);
        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom!.CourseId);

        // Allow deletion by sender or teacher
        bool isTeacher = course?.TeacherId == userId;
        if (message.SenderId != userId && !isTeacher)
            throw new UnauthorizedException("You can only delete your own messages");

        message.IsDeleted = true;
        message.Content = "[Message deleted]";

        await _unitOfWork.ChatMessages.UpdateAsync(message);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<ChatMessagesPageDto> GetMessagesAsync(int userId, GetMessagesDto getDto)
    {
        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(getDto.ChatRoomId);
        if (chatRoom == null || !chatRoom.IsActive)
            throw new NotFoundException("Chat room not found");

        // Verify access
        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom.CourseId);
        bool isTeacher = course?.TeacherId == userId;

        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == chatRoom.CourseId && e.Status == EnrollmentStatus.Approved);
            if (enrollment == null)
                throw new UnauthorizedException("You don't have access to this chat room");
        }

        var allMessages = await _unitOfWork.ChatMessages.FindAsync(m => m.ChatRoomId == getDto.ChatRoomId);
        var query = allMessages.AsQueryable();

        if (getDto.BeforeMessageId.HasValue)
        {
            var beforeMessage = await _unitOfWork.ChatMessages.GetByIdAsync(getDto.BeforeMessageId.Value);
            if (beforeMessage != null)
            {
                query = query.Where(m => m.CreatedAt < beforeMessage.CreatedAt);
            }
        }

        var totalCount = query.Count();
        var messages = query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((getDto.Page - 1) * getDto.PageSize)
            .Take(getDto.PageSize + 1) // Take one extra to check if there are more
            .ToList();

        bool hasMore = messages.Count > getDto.PageSize;
        if (hasMore)
            messages = messages.Take(getDto.PageSize).ToList();

        var messageDtos = new List<ChatMessageResponseDto>();
        foreach (var message in messages.OrderBy(m => m.CreatedAt))
        {
            messageDtos.Add(await BuildMessageResponse(message, userId));
        }

        return new ChatMessagesPageDto
        {
            Messages = messageDtos,
            HasMore = hasMore,
            TotalCount = totalCount
        };
    }

    private async Task<ChatMessageResponseDto> BuildMessageResponse(ChatMessage message, int userId)
    {
        var sender = await _unitOfWork.Users.GetByIdAsync(message.SenderId);
        var chatRoom = await _unitOfWork.ChatRooms.GetByIdAsync(message.ChatRoomId);
        var course = await _unitOfWork.Courses.GetByIdAsync(chatRoom!.CourseId);

        ChatMessageResponseDto? replyToDto = null;
        if (message.ReplyToMessageId.HasValue)
        {
            var replyTo = await _unitOfWork.ChatMessages.GetByIdAsync(message.ReplyToMessageId.Value);
            if (replyTo != null)
            {
                var replyToSender = await _unitOfWork.Users.GetByIdAsync(replyTo.SenderId);
                replyToDto = new ChatMessageResponseDto
                {
                    Id = replyTo.Id,
                    Content = replyTo.IsDeleted ? "[Message deleted]" : replyTo.Content,
                    SenderId = replyTo.SenderId,
                    SenderName = $"{replyToSender?.FirstName} {replyToSender?.LastName}",
                    SenderInitials = $"{replyToSender?.FirstName?[0]}{replyToSender?.LastName?[0]}",
                    IsTeacher = course?.TeacherId == replyTo.SenderId,
                    CreatedAt = replyTo.CreatedAt,
                    IsEdited = replyTo.IsEdited,
                    IsDeleted = replyTo.IsDeleted,
                    IsOwnMessage = replyTo.SenderId == userId
                };
            }
        }

        return new ChatMessageResponseDto
        {
            Id = message.Id,
            Content = message.Content,
            SenderId = message.SenderId,
            SenderName = $"{sender?.FirstName} {sender?.LastName}",
            SenderInitials = $"{sender?.FirstName?[0]}{sender?.LastName?[0]}",
            IsTeacher = course?.TeacherId == message.SenderId,
            CreatedAt = message.CreatedAt,
            IsEdited = message.IsEdited,
            IsDeleted = message.IsDeleted,
            ReplyToMessageId = message.ReplyToMessageId,
            ReplyToMessage = replyToDto,
            IsOwnMessage = message.SenderId == userId
        };
    }
}






