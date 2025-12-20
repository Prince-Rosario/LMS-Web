namespace Edify.Core.Entities;

public class AnswerOption : BaseEntity
{
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;
    public int OrderIndex { get; set; }
    
    public int QuestionId { get; set; }
    
    // Navigation properties
    public Question Question { get; set; } = null!;
}






