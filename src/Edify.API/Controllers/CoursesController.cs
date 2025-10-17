using System.Security.Claims;
using Edify.Core.DTOs.Courses;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

/// <summary>
/// Course management controller for creating, joining, and managing courses
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;
    
    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }
    
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
    
    /// <summary>
    /// Create a new course (Teacher only)
    /// </summary>
    /// <param name="createCourseDto">Course details including title, description, and invitation code requirement</param>
    /// <returns>The created course details with generated invitation code (if required)</returns>
    /// <response code="200">Returns the newly created course</response>
    /// <response code="400">If the course data is invalid</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not a teacher</response>
    [HttpPost]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(CourseResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CourseResponseDto>> CreateCourse([FromBody] CreateCourseDto createCourseDto)
    {
        var teacherId = GetUserId();
        var response = await _courseService.CreateCourseAsync(teacherId, createCourseDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Join a course using invitation code (Student only)
    /// </summary>
    /// <param name="joinCourseDto">Contains the course ID and invitation code (if required)</param>
    /// <returns>The joined course details</returns>
    /// <response code="200">Returns the course that was joined</response>
    /// <response code="400">If the invitation code is invalid or enrollment request already exists</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not a student</response>
    /// <response code="404">If the course is not found</response>
    [HttpPost("join")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(CourseResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CourseResponseDto>> JoinCourse([FromBody] JoinCourseDto joinCourseDto)
    {
        var studentId = GetUserId();
        var response = await _courseService.JoinCourseAsync(studentId, joinCourseDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Get all pending enrollment requests for a specific course (Teacher only)
    /// </summary>
    /// <param name="courseId">The ID of the course to get enrollment requests for</param>
    /// <returns>List of pending enrollment requests with student information</returns>
    /// <response code="200">Returns the list of enrollment requests</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not the teacher of this course</response>
    /// <response code="404">If the course is not found</response>
    [HttpGet("{courseId}/enrollment-requests")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(IEnumerable<EnrollmentRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<EnrollmentRequestDto>>> GetEnrollmentRequests(int courseId)
    {
        var teacherId = GetUserId();
        var requests = await _courseService.GetEnrollmentRequestsAsync(teacherId, courseId);
        return Ok(requests);
    }
    
    /// <summary>
    /// Approve or reject a student's enrollment request (Teacher only)
    /// </summary>
    /// <param name="approveDto">Contains enrollment ID and approval decision (true to approve, false to reject)</param>
    /// <returns>Success message</returns>
    /// <response code="200">Enrollment request was successfully processed</response>
    /// <response code="400">If the enrollment data is invalid</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not the teacher of this course</response>
    /// <response code="404">If the enrollment request is not found</response>
    [HttpPost("enrollment/approve")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ApproveEnrollment([FromBody] ApproveEnrollmentDto approveDto)
    {
        var teacherId = GetUserId();
        await _courseService.ApproveEnrollmentAsync(teacherId, approveDto);
        return Ok(new { message = "Enrollment updated successfully" });
    }
    
    /// <summary>
    /// Get all courses for the authenticated user (different results for Teachers and Students)
    /// </summary>
    /// <returns>List of courses - created courses for teachers, enrolled courses for students</returns>
    /// <response code="200">Returns the list of courses</response>
    /// <response code="401">If user is not authenticated or has an invalid role</response>
    [HttpGet("my-courses")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetMyCourses()
    {
        var userId = GetUserId();
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        IEnumerable<CourseResponseDto> courses;
        
        if (userRole == "Teacher")
        {
            courses = await _courseService.GetTeacherCoursesAsync(userId);
        }
        else if (userRole == "Student")
        {
            courses = await _courseService.GetStudentCoursesAsync(userId);
        }
        else
        {
            return Unauthorized(new { message = "Invalid user role" });
        }
        
        return Ok(courses);
    }
}




