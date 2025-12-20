using Edify.API.Hubs;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Edify.API.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyMaterialPublishedAsync(int courseId, int materialId, string title, string type, string uploadedBy, DateTime uploadedAt)
    {
        await _hubContext.Clients.Group($"course_{courseId}")
            .SendAsync("MaterialPublished", new
            {
                courseId,
                materialId,
                title,
                type,
                uploadedBy,
                uploadedAt
            });
    }

    public async Task NotifyTestPublishedAsync(int courseId, int testId, string title, DateTime? dueDate)
    {
        await _hubContext.Clients.Group($"course_{courseId}")
            .SendAsync("TestPublished", new
            {
                courseId,
                testId,
                title,
                dueDate,
                publishedAt = DateTime.UtcNow
            });
    }

    public async Task NotifyTestGradedAsync(int studentId, int testId, string testTitle, int attemptId, decimal? score, decimal? maxScore, decimal? percentage, bool? passed)
    {
        await _hubContext.Clients.Group($"student_{studentId}")
            .SendAsync("TestGraded", new
            {
                testId,
                testTitle,
                attemptId,
                score,
                maxScore,
                percentage,
                passed,
                gradedAt = DateTime.UtcNow
            });
    }
}


