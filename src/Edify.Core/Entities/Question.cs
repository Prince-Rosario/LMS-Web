using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class Question : BaseEntity
{
    public string QuestionText { get; set; } = string.Empty;
    public string? Explanation { get; set; }  // Shown after answering
    public QuestionType Type { get; set; }
    public decimal Points { get; set; } = 1;
    public int OrderIndex { get; set; }
    
    // For short answer questions - acceptable answers (comma-separated for multiple)
    public string? CorrectShortAnswer { get; set; }
    public bool CaseSensitive { get; set; } = false;
    
    public int TestId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public Test Test { get; set; } = null!;
    public ICollection<AnswerOption> AnswerOptions { get; set; } = new List<AnswerOption>();
    public ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
}






