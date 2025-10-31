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
    /// Get all courses for the authenticated user (supports multi-role users)
    /// </summary>
    /// <returns>List of all courses - both created courses (if user can teach) and enrolled courses (if user can study)</returns>
    /// <response code="200">Returns the list of courses</response>
    /// <response code="401">If user is not authenticated</response>
    [HttpGet("my-courses")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetMyCourses()
    {
        var userId = GetUserId();
        var courses = await _courseService.GetAllUserCoursesAsync(userId);
        return Ok(courses);
    }
    
    // Admin endpoints
    
    /// <summary>
    /// Get all pending course creation requests (Admin only)
    /// </summary>
    /// <remarks>
    /// Returns all courses awaiting admin approval. Teachers create courses with "Pending" status,
    /// and admins must review and approve/reject them before they become visible to students.
    /// 
    /// Sample request:
    /// 
    ///     GET /api/courses/admin/pending
    ///     
    /// </remarks>
    /// <returns>List of courses with status "Pending"</returns>
    /// <response code="200">Returns the list of pending courses</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not an admin</response>
    [HttpGet("admin/pending")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetPendingCourses()
    {
        var adminId = GetUserId();
        var courses = await _courseService.GetPendingCoursesAsync(adminId);
        return Ok(courses);
    }
    
    /// <summary>
    /// Approve or reject a course creation request (Admin only)
    /// </summary>
    /// <remarks>
    /// Allows admins to approve or reject pending course requests. 
    /// When approved, the course becomes active and students can join.
    /// When rejected, provide a rejection reason so the teacher knows why.
    /// 
    /// Sample request to approve:
    /// 
    ///     POST /api/courses/admin/approve
    ///     {
    ///         "courseId": 1,
    ///         "approve": true,
    ///         "rejectionReason": null
    ///     }
    ///     
    /// Sample request to reject:
    /// 
    ///     POST /api/courses/admin/approve
    ///     {
    ///         "courseId": 1,
    ///         "approve": false,
    ///         "rejectionReason": "Course content is not appropriate"
    ///     }
    ///     
    /// </remarks>
    /// <param name="approveDto">Course approval details</param>
    /// <returns>Success message</returns>
    /// <response code="200">Course decision processed successfully</response>
    /// <response code="400">If course is not in pending status or validation fails</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not an admin</response>
    /// <response code="404">If course not found</response>
    [HttpPost("admin/approve")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ApproveCourse([FromBody] ApproveCourseDto approveDto)
    {
        var adminId = GetUserId();
        await _courseService.ApproveCourseAsync(adminId, approveDto);
        return Ok(new { message = "Course decision processed successfully" });
    }
    
    /// <summary>
    /// Get all courses regardless of status (Admin only)
    /// </summary>
    /// <remarks>
    /// Returns all courses in the system: pending, approved, and rejected.
    /// Useful for admin dashboard to see overview of all course requests and their statuses.
    /// 
    /// Sample request:
    /// 
    ///     GET /api/courses/admin/all
    ///     
    /// </remarks>
    /// <returns>List of all courses with their current status</returns>
    /// <response code="200">Returns the list of all courses</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not an admin</response>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetAllCourses()
    {
        var adminId = GetUserId();
        var courses = await _courseService.GetAllCoursesAsync(adminId);
        return Ok(courses);
    }
    
    /// <summary>
    /// Delete a course completely (Admin only)
    /// </summary>
    /// <remarks>
    /// Permanently deletes a course and all associated data including:
    /// - All enrollments
    /// - All materials
    /// - All material progress records
    /// 
    /// This action cannot be undone. Use with caution.
    /// 
    /// Sample request:
    /// 
    ///     DELETE /api/courses/admin/1
    ///     
    /// </remarks>
    /// <param name="courseId">The ID of the course to delete</param>
    /// <returns>Success message</returns>
    /// <response code="200">Course deleted successfully</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user is not an admin</response>
    /// <response code="404">If course not found</response>
    [HttpDelete("admin/{courseId}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteCourse(int courseId)
    {
        var adminId = GetUserId();
        await _courseService.DeleteCourseAsync(adminId, courseId);
        return Ok(new { message = "Course deleted successfully" });
    }
    
    /// <summary>
    /// Update course details (Teacher only)
    /// </summary>
    /// <param name="courseId">Course ID to update</param>
    /// <param name="updateCourseDto">Updated course details</param>
    /// <returns>Updated course details</returns>
    /// <response code="200">Course updated successfully</response>
    /// <response code="400">Validation error</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (not the course owner)</response>
    /// <response code="404">Course not found</response>
    [HttpPut("{courseId}")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(CourseResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CourseResponseDto>> UpdateCourse(int courseId, [FromBody] UpdateCourseDto updateCourseDto)
    {
        var teacherId = GetUserId();
        var course = await _courseService.UpdateCourseAsync(teacherId, courseId, updateCourseDto);
        return Ok(course);
    }
}




