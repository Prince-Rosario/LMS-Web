using Edify.Core.Enums;

namespace Edify.Core.DTOs.Tests;

public class TestResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    
    public int TimeLimitMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public decimal PassingScore { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleAnswers { get; set; }
    public bool ShowResultsImmediately { get; set; }
    public bool ShowCorrectAnswers { get; set; }
    
    public DateTime? AvailableFrom { get; set; }
    public DateTime? AvailableUntil { get; set; }
    
    public TestStatus Status { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public int QuestionCount { get; set; }
    public decimal TotalPoints { get; set; }
    
    // For teachers - total submission count
    public int AttemptCount { get; set; }
    
    // For students - their attempt info
    public int? AttemptsUsed { get; set; }
    public decimal? BestScore { get; set; }
    public bool? HasPassed { get; set; }
    
    public List<QuestionResponseDto> Questions { get; set; } = new();
}

public class QuestionResponseDto
{
    public int Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public QuestionType Type { get; set; }
    public decimal Points { get; set; }
    public int OrderIndex { get; set; }
    
    // Only shown to teachers or after test completion (if ShowCorrectAnswers)
    public string? CorrectShortAnswer { get; set; }
    public bool CaseSensitive { get; set; }
    
    public List<AnswerOptionResponseDto> AnswerOptions { get; set; } = new();
}

public class AnswerOptionResponseDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    
    // Only shown to teachers or after test completion (if ShowCorrectAnswers)
    public bool? IsCorrect { get; set; }
}

// Simplified version for students taking the test (no correct answers shown)
public class TestTakingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int TimeLimitMinutes { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int AttemptId { get; set; }
    
    public List<QuestionTakingDto> Questions { get; set; } = new();
}

public class QuestionTakingDto
{
    public int Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public decimal Points { get; set; }
    public int OrderIndex { get; set; }
    
    public List<AnswerOptionTakingDto> AnswerOptions { get; set; } = new();
}

public class AnswerOptionTakingDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}

