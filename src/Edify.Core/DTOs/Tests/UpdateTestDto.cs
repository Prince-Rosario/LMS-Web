using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Tests;

public class UpdateTestDto
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [StringLength(2000)]
    public string? Instructions { get; set; }
    
    [Range(0, 480)]
    public int? TimeLimitMinutes { get; set; }
    
    [Range(0, 10)]
    public int? MaxAttempts { get; set; }
    
    [Range(0, 100)]
    public decimal? PassingScore { get; set; }
    
    public bool? ShuffleQuestions { get; set; }
    public bool? ShuffleAnswers { get; set; }
    public bool? ShowResultsImmediately { get; set; }
    public bool? ShowCorrectAnswers { get; set; }
    
    public DateTime? AvailableFrom { get; set; }
    public DateTime? AvailableUntil { get; set; }
    
    public int? Status { get; set; }  // TestStatus enum
}

public class UpdateQuestionDto
{
    public int? Id { get; set; }  // If null, create new; if set, update existing
    
    [StringLength(2000, MinimumLength = 1)]
    public string? QuestionText { get; set; }
    
    [StringLength(1000)]
    public string? Explanation { get; set; }
    
    public int? Type { get; set; }
    
    [Range(0.1, 100)]
    public decimal? Points { get; set; }
    
    public int? OrderIndex { get; set; }
    
    [StringLength(500)]
    public string? CorrectShortAnswer { get; set; }
    public bool? CaseSensitive { get; set; }
    
    public List<UpdateAnswerOptionDto>? AnswerOptions { get; set; }
}

public class UpdateAnswerOptionDto
{
    public int? Id { get; set; }
    
    [StringLength(1000, MinimumLength = 1)]
    public string? OptionText { get; set; }
    
    public bool? IsCorrect { get; set; }
    public int? OrderIndex { get; set; }
}

