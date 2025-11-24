using System.Security.Claims;
using Edify.Core.DTOs.Tests;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

/// <summary>
/// Test/Quiz management controller for creating, taking, and grading tests
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestsController : ControllerBase
{
    private readonly ITestService _testService;

    public TestsController(ITestService testService)
    {
        _testService = testService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    #region Test CRUD (Teacher)

    /// <summary>
    /// Create a new test (Teacher only)
    /// </summary>
    /// <param name="createDto">Test details including questions and answer options</param>
    /// <returns>The created test</returns>
    [HttpPost]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(TestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TestResponseDto>> CreateTest([FromBody] CreateTestDto createDto)
    {
        var userId = GetUserId();
        var test = await _testService.CreateTestAsync(userId, createDto);
        return Ok(test);
    }

    /// <summary>
    /// Update a test (Teacher only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <param name="updateDto">Updated test details</param>
    /// <returns>The updated test</returns>
    [HttpPut("{testId}")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(TestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestResponseDto>> UpdateTest(int testId, [FromBody] UpdateTestDto updateDto)
    {
        var userId = GetUserId();
        var test = await _testService.UpdateTestAsync(userId, testId, updateDto);
        return Ok(test);
    }

    /// <summary>
    /// Delete a test (Teacher only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    [HttpDelete("{testId}")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteTest(int testId)
    {
        var userId = GetUserId();
        await _testService.DeleteTestAsync(userId, testId);
        return Ok(new { message = "Test deleted successfully" });
    }

    /// <summary>
    /// Get a specific test by ID
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <returns>Test details</returns>
    [HttpGet("{testId}")]
    [ProducesResponseType(typeof(TestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestResponseDto>> GetTest(int testId)
    {
        var userId = GetUserId();
        var test = await _testService.GetTestByIdAsync(testId, userId);
        return Ok(test);
    }

    /// <summary>
    /// Get all tests for a course
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <returns>List of tests</returns>
    [HttpGet("course/{courseId}")]
    [ProducesResponseType(typeof(IEnumerable<TestResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<TestResponseDto>>> GetCourseTests(int courseId)
    {
        var userId = GetUserId();
        var tests = await _testService.GetCourseTestsAsync(courseId, userId);
        return Ok(tests);
    }

    /// <summary>
    /// Publish a test to make it available to students (Teacher only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <returns>The published test</returns>
    [HttpPost("{testId}/publish")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(TestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestResponseDto>> PublishTest(int testId)
    {
        var userId = GetUserId();
        var test = await _testService.PublishTestAsync(userId, testId);
        return Ok(test);
    }

    /// <summary>
    /// Close a test to stop accepting submissions (Teacher only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <returns>The closed test</returns>
    [HttpPost("{testId}/close")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(TestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestResponseDto>> CloseTest(int testId)
    {
        var userId = GetUserId();
        var test = await _testService.CloseTestAsync(userId, testId);
        return Ok(test);
    }

    #endregion

    #region Question Management (Teacher)

    /// <summary>
    /// Add a question to a test (Teacher only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <param name="questionDto">Question details</param>
    /// <returns>The created question</returns>
    [HttpPost("{testId}/questions")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(QuestionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuestionResponseDto>> AddQuestion(int testId, [FromBody] CreateQuestionDto questionDto)
    {
        var userId = GetUserId();
        var question = await _testService.AddQuestionAsync(userId, testId, questionDto);
        return Ok(question);
    }

    /// <summary>
    /// Update a question (Teacher only)
    /// </summary>
    /// <param name="questionId">Question ID</param>
    /// <param name="questionDto">Updated question details</param>
    /// <returns>The updated question</returns>
    [HttpPut("questions/{questionId}")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(QuestionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuestionResponseDto>> UpdateQuestion(int questionId, [FromBody] UpdateQuestionDto questionDto)
    {
        var userId = GetUserId();
        var question = await _testService.UpdateQuestionAsync(userId, questionId, questionDto);
        return Ok(question);
    }

    /// <summary>
    /// Delete a question (Teacher only)
    /// </summary>
    /// <param name="questionId">Question ID</param>
    [HttpDelete("questions/{questionId}")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteQuestion(int questionId)
    {
        var userId = GetUserId();
        await _testService.DeleteQuestionAsync(userId, questionId);
        return Ok(new { message = "Question deleted successfully" });
    }

    #endregion

    #region Test Taking (Student)

    /// <summary>
    /// Start a test attempt (Student only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <returns>Test questions and attempt information</returns>
    [HttpPost("{testId}/start")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(TestTakingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestTakingDto>> StartTest(int testId)
    {
        var userId = GetUserId();
        var testTaking = await _testService.StartTestAttemptAsync(userId, testId);
        return Ok(testTaking);
    }

    /// <summary>
    /// Save an answer during test taking (auto-save) (Student only)
    /// </summary>
    /// <param name="saveDto">Answer to save</param>
    /// <returns>Saved answer confirmation</returns>
    [HttpPost("save-answer")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(StudentAnswerResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<StudentAnswerResponseDto>> SaveAnswer([FromBody] SaveAnswerDto saveDto)
    {
        var userId = GetUserId();
        var answer = await _testService.SaveAnswerAsync(userId, saveDto);
        return Ok(answer);
    }

    /// <summary>
    /// Submit a test (Student only)
    /// </summary>
    /// <param name="submitDto">Test submission with all answers</param>
    /// <returns>Test results</returns>
    [HttpPost("submit")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(TestAttemptResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TestAttemptResponseDto>> SubmitTest([FromBody] SubmitTestDto submitDto)
    {
        var userId = GetUserId();
        var result = await _testService.SubmitTestAsync(userId, submitDto);
        return Ok(result);
    }

    /// <summary>
    /// Get a specific test attempt result
    /// </summary>
    /// <param name="attemptId">Attempt ID</param>
    /// <returns>Test attempt details with answers and scores</returns>
    [HttpGet("attempts/{attemptId}")]
    [ProducesResponseType(typeof(TestAttemptResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestAttemptResponseDto>> GetAttemptResult(int attemptId)
    {
        var userId = GetUserId();
        var result = await _testService.GetAttemptResultAsync(attemptId, userId);
        return Ok(result);
    }

    /// <summary>
    /// Get all my test attempts (Student)
    /// </summary>
    /// <param name="testId">Optional: filter by test ID</param>
    /// <returns>List of test attempts</returns>
    [HttpGet("my-attempts")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(IEnumerable<TestAttemptResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<TestAttemptResponseDto>>> GetMyAttempts([FromQuery] int? testId = null)
    {
        var userId = GetUserId();
        var attempts = await _testService.GetMyAttemptsAsync(userId, testId);
        return Ok(attempts);
    }

    #endregion

    #region Grading (Teacher)

    /// <summary>
    /// Get all attempts for a test (Teacher or Admin only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <returns>List of all student attempts</returns>
    [HttpGet("{testId}/attempts")]
    [Authorize(Roles = "Teacher,Admin")]
    [ProducesResponseType(typeof(IEnumerable<TestAttemptResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<TestAttemptResponseDto>>> GetTestAttempts(int testId)
    {
        var userId = GetUserId();
        var attempts = await _testService.GetTestAttemptsAsync(userId, testId);
        return Ok(attempts);
    }

    /// <summary>
    /// Grade a test attempt (Teacher or Admin only)
    /// </summary>
    /// <param name="gradeDto">Grading details for essay/short answer questions</param>
    /// <returns>Updated test attempt with grades</returns>
    [HttpPost("grade")]
    [Authorize(Roles = "Teacher,Admin")]
    [ProducesResponseType(typeof(TestAttemptResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestAttemptResponseDto>> GradeAttempt([FromBody] GradeAttemptDto gradeDto)
    {
        var userId = GetUserId();
        var result = await _testService.GradeAttemptAsync(userId, gradeDto);
        return Ok(result);
    }

    /// <summary>
    /// Get test summary/analytics (Teacher or Admin only)
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <returns>Test statistics including average score, pass rate, etc.</returns>
    [HttpGet("{testId}/summary")]
    [Authorize(Roles = "Teacher,Admin")]
    [ProducesResponseType(typeof(TestSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestSummaryDto>> GetTestSummary(int testId)
    {
        var userId = GetUserId();
        var summary = await _testService.GetTestSummaryAsync(userId, testId);
        return Ok(summary);
    }

    #endregion
}

