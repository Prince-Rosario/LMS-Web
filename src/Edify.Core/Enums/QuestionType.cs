namespace Edify.Core.Enums;

public enum QuestionType
{
    MultipleChoice = 0,      // Single correct answer from multiple options
    MultipleSelect = 1,      // Multiple correct answers
    TrueFalse = 2,           // True or False
    ShortAnswer = 3,         // Text input (auto-graded or manual)
    Essay = 4                // Long text (manual grading required)
}

