using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class TestAttempt : BaseEntity
{
    public int TestId { get; set; }
    public int StudentId { get; set; }
    public int AttemptNumber { get; set; } = 1;
    
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
    
    public decimal? Score { get; set; }           // Points earned
    public decimal? MaxScore { get; set; }        // Total possible points
    public decimal? Percentage { get; set; }      // Score percentage
    public bool? Passed { get; set; }
    
    public TestAttemptStatus Status { get; set; } = TestAttemptStatus.InProgress;
    
    // For timed tests
    public DateTime? ExpiresAt { get; set; }
    
    // Teacher feedback
    public string? Feedback { get; set; }
    public int? GradedByUserId { get; set; }
    
    // Navigation properties
    public Test Test { get; set; } = null!;
    public User Student { get; set; } = null!;
    public User? GradedBy { get; set; }
    public ICollection<StudentAnswer> Answers { get; set; } = new List<StudentAnswer>();
}


