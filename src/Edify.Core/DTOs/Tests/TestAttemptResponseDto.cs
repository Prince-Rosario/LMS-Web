using Edify.Core.Enums;

namespace Edify.Core.DTOs.Tests;

public class TestAttemptResponseDto
{
    public int Id { get; set; }
    public int TestId { get; set; }
    public string TestTitle { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    
    public decimal? Score { get; set; }
    public decimal? MaxScore { get; set; }
    public decimal? Percentage { get; set; }
    public bool? Passed { get; set; }
    
    public TestAttemptStatus Status { get; set; }
    public string? Feedback { get; set; }
    public string? GradedBy { get; set; }
    
    public List<StudentAnswerResponseDto> Answers { get; set; } = new();
}

public class StudentAnswerResponseDto
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal QuestionPoints { get; set; }
    
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    
    public decimal? PointsEarned { get; set; }
    public bool? IsCorrect { get; set; }
    public string? Feedback { get; set; }
    
    // For review - show correct answers
    public List<int>? CorrectOptionIds { get; set; }
    public string? CorrectShortAnswer { get; set; }
    public string? Explanation { get; set; }
    
    // Answer options for display
    public List<AnswerOptionForReviewDto> Options { get; set; } = new();
}

public class AnswerOptionForReviewDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class GradeAnswerDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public int StudentAnswerId { get; set; }
    
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.Range(0, 100)]
    public decimal PointsEarned { get; set; }
    
    [System.ComponentModel.DataAnnotations.StringLength(1000)]
    public string? Feedback { get; set; }
}

public class GradeAttemptDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public int AttemptId { get; set; }
    
    [System.ComponentModel.DataAnnotations.StringLength(2000)]
    public string? Feedback { get; set; }
    
    public List<GradeAnswerDto> Grades { get; set; } = new();
}

public class TestSummaryDto
{
    public int TestId { get; set; }
    public string TestTitle { get; set; } = string.Empty;
    public int TotalAttempts { get; set; }
    public int UniqueStudents { get; set; }
    public decimal AverageScore { get; set; }
    public decimal HighestScore { get; set; }
    public decimal LowestScore { get; set; }
    public int PassedCount { get; set; }
    public int FailedCount { get; set; }
    public decimal PassRate { get; set; }
}

