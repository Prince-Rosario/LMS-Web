namespace Edify.Core.Entities;

public class StudentAnswer : BaseEntity
{
    public int TestAttemptId { get; set; }
    public int QuestionId { get; set; }
    
    // For multiple choice / multiple select - comma-separated answer option IDs
    public string? SelectedOptionIds { get; set; }
    
    // For short answer / essay
    public string? TextAnswer { get; set; }
    
    // Grading
    public decimal? PointsEarned { get; set; }
    public bool? IsCorrect { get; set; }
    public string? Feedback { get; set; }  // Per-question feedback
    
    // Navigation properties
    public TestAttempt TestAttempt { get; set; } = null!;
    public Question Question { get; set; } = null!;
}


