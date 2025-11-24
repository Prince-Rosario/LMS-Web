using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Tests;

public class CreateTestDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [StringLength(2000)]
    public string? Instructions { get; set; }
    
    [Range(0, 480)]
    public int TimeLimitMinutes { get; set; } = 60;
    
    [Range(0, 10)]
    public int MaxAttempts { get; set; } = 1;
    
    [Range(0, 100)]
    public decimal PassingScore { get; set; } = 50;
    
    public bool ShuffleQuestions { get; set; } = false;
    public bool ShuffleAnswers { get; set; } = false;
    public bool ShowResultsImmediately { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; } = true;
    
    public DateTime? AvailableFrom { get; set; }
    public DateTime? AvailableUntil { get; set; }
    
    [Required]
    public int CourseId { get; set; }
    
    public List<CreateQuestionDto> Questions { get; set; } = new();
}

public class CreateQuestionDto
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string QuestionText { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Explanation { get; set; }
    
    [Required]
    public int Type { get; set; }  // QuestionType enum
    
    [Range(0.1, 100)]
    public decimal Points { get; set; } = 1;
    
    public int OrderIndex { get; set; }
    
    // For short answer
    [StringLength(500)]
    public string? CorrectShortAnswer { get; set; }
    public bool CaseSensitive { get; set; } = false;
    
    public List<CreateAnswerOptionDto> AnswerOptions { get; set; } = new();
}

public class CreateAnswerOptionDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string OptionText { get; set; } = string.Empty;
    
    public bool IsCorrect { get; set; } = false;
    public int OrderIndex { get; set; }
}

