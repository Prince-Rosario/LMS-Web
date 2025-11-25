using Edify.Core.DTOs.Tests;

namespace Edify.Core.Interfaces;

public interface ITestService
{
    // Test CRUD (Teacher)
    Task<TestResponseDto> CreateTestAsync(int userId, CreateTestDto createDto);
    Task<TestResponseDto> UpdateTestAsync(int userId, int testId, UpdateTestDto updateDto);
    Task DeleteTestAsync(int userId, int testId);
    Task<TestResponseDto> GetTestByIdAsync(int testId, int userId);
    Task<IEnumerable<TestResponseDto>> GetCourseTestsAsync(int courseId, int userId);
    Task<TestResponseDto> PublishTestAsync(int userId, int testId);
    Task<TestResponseDto> CloseTestAsync(int userId, int testId);
    
    // Question management
    Task<QuestionResponseDto> AddQuestionAsync(int userId, int testId, CreateQuestionDto questionDto);
    Task<QuestionResponseDto> UpdateQuestionAsync(int userId, int questionId, UpdateQuestionDto questionDto);
    Task DeleteQuestionAsync(int userId, int questionId);
    
    // Test taking (Student)
    Task<TestTakingDto> StartTestAttemptAsync(int userId, int testId);
    Task<StudentAnswerResponseDto> SaveAnswerAsync(int userId, SaveAnswerDto saveDto);
    Task<TestAttemptResponseDto> SubmitTestAsync(int userId, SubmitTestDto submitDto);
    Task<TestAttemptResponseDto> GetAttemptResultAsync(int attemptId, int userId);
    Task<IEnumerable<TestAttemptResponseDto>> GetMyAttemptsAsync(int userId, int? testId = null);
    
    // Grading (Teacher)
    Task<IEnumerable<TestAttemptResponseDto>> GetTestAttemptsAsync(int userId, int testId);
    Task<TestAttemptResponseDto> GradeAttemptAsync(int userId, GradeAttemptDto gradeDto);
    Task<TestSummaryDto> GetTestSummaryAsync(int userId, int testId);
}


