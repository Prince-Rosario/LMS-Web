using System.Security.Claims;
using Edify.Core.DTOs.Courses;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

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
    
    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<CourseResponseDto>> CreateCourse([FromBody] CreateCourseDto createCourseDto)
    {
        var teacherId = GetUserId();
        var response = await _courseService.CreateCourseAsync(teacherId, createCourseDto);
        return Ok(response);
    }
    
    [HttpPost("join")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<CourseResponseDto>> JoinCourse([FromBody] JoinCourseDto joinCourseDto)
    {
        var studentId = GetUserId();
        var response = await _courseService.JoinCourseAsync(studentId, joinCourseDto);
        return Ok(response);
    }
    
    [HttpGet("{courseId}/enrollment-requests")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<IEnumerable<EnrollmentRequestDto>>> GetEnrollmentRequests(int courseId)
    {
        var teacherId = GetUserId();
        var requests = await _courseService.GetEnrollmentRequestsAsync(teacherId, courseId);
        return Ok(requests);
    }
    
    [HttpPost("enrollment/approve")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult> ApproveEnrollment([FromBody] ApproveEnrollmentDto approveDto)
    {
        var teacherId = GetUserId();
        await _courseService.ApproveEnrollmentAsync(teacherId, approveDto);
        return Ok(new { message = "Enrollment updated successfully" });
    }
    
    [HttpGet("my-courses")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<IEnumerable<CourseResponseDto>>> GetMyCourses()
    {
        var studentId = GetUserId();
        var courses = await _courseService.GetStudentCoursesAsync(studentId);
        return Ok(courses);
    }
}




