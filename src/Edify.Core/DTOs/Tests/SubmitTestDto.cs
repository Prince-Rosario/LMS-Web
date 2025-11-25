using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Tests;

public class StartTestAttemptDto
{
    [Required]
    public int TestId { get; set; }
}

public class SubmitTestDto
{
    [Required]
    public int AttemptId { get; set; }
    
    public List<SubmitAnswerDto> Answers { get; set; } = new();
}

public class SubmitAnswerDto
{
    [Required]
    public int QuestionId { get; set; }
    
    // For multiple choice / multiple select - list of selected option IDs
    public List<int>? SelectedOptionIds { get; set; }
    
    // For short answer / essay
    [StringLength(10000)]
    public string? TextAnswer { get; set; }
}

public class SaveAnswerDto
{
    [Required]
    public int AttemptId { get; set; }
    
    [Required]
    public int QuestionId { get; set; }
    
    public List<int>? SelectedOptionIds { get; set; }
    
    [StringLength(10000)]
    public string? TextAnswer { get; set; }
}


