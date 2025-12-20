namespace Edify.Core.Interfaces;

public interface INotificationService
{
    Task NotifyMaterialPublishedAsync(int courseId, int materialId, string title, string type, string uploadedBy, DateTime uploadedAt);
    Task NotifyTestPublishedAsync(int courseId, int testId, string title, DateTime? dueDate);
    Task NotifyTestGradedAsync(int studentId, int testId, string testTitle, int attemptId, decimal? score, decimal? maxScore, decimal? percentage, bool? passed);
}


