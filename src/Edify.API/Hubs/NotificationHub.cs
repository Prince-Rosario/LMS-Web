using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Edify.Core.Interfaces;

namespace Edify.API.Hubs;

/// <summary>
/// SignalR Hub for real-time notification delivery
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly IUnitOfWork _unitOfWork;

    // Track user connections: UserId -> List of ConnectionIds
    private static readonly Dictionary<int, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public NotificationHub(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        // Auto-join all course notification groups the user has access to
        await JoinUserCourseGroups(userId);
        
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
    /// Get list of online users (for debugging/status)
    /// </summary>
    public Task<int> GetOnlineUserCount()
    {
        lock (_lock)
        {
            return Task.FromResult(_userConnections.Count);
        }
    }

    /// <summary>
    /// Check if a specific user is online
    /// </summary>
    public static bool IsUserOnline(int userId)
    {
        lock (_lock)
        {
            return _userConnections.ContainsKey(userId);
        }
    }

    #region Helper Methods

    private async Task JoinUserCourseGroups(int userId)
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

        // Get courses where user is enrolled as student
        if (user.CanStudy)
        {
            var enrollments = await _unitOfWork.Enrollments.FindAsync(
                e => e.StudentId == userId && e.Status == Core.Enums.EnrollmentStatus.Approved);
            courseIds.AddRange(enrollments.Select(e => e.CourseId));
        }

        courseIds = courseIds.Distinct().ToList();

        // Join all course notification groups
        foreach (var courseId in courseIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetCourseGroupName(courseId));
        }
    }

    private static string GetCourseGroupName(int courseId) => $"course_{courseId}";
    
    private static string GetStudentGroupName(int userId) => $"student_{userId}";

    #endregion
}


