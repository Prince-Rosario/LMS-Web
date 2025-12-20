using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class Test : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    
    // Test settings
    public int TimeLimitMinutes { get; set; } = 60;  // 0 = no time limit
    public int MaxAttempts { get; set; } = 1;        // 0 = unlimited
    public decimal PassingScore { get; set; } = 50;  // Percentage
    public bool ShuffleQuestions { get; set; } = false;
    public bool ShuffleAnswers { get; set; } = false;
    public bool ShowResultsImmediately { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; } = true;
    
    // Availability
    public DateTime? AvailableFrom { get; set; }
    public DateTime? AvailableUntil { get; set; }
    
    public TestStatus Status { get; set; } = TestStatus.Draft;
    public int CourseId { get; set; }
    public int CreatedByUserId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public Course Course { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<TestAttempt> Attempts { get; set; } = new List<TestAttempt>();
}






