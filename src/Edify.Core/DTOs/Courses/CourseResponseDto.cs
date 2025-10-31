using Edify.Core.Enums;

namespace Edify.Core.DTOs.Courses;

/// <summary>
/// DTO for course response containing course details and approval status
/// </summary>
public class CourseResponseDto
{
    /// <summary>
    /// Unique identifier for the course
    /// </summary>
    /// <example>1</example>
    public int Id { get; set; }
    
    /// <summary>
    /// Course title
    /// </summary>
    /// <example>Introduction to Programming</example>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Course description (optional)
    /// </summary>
    /// <example>Learn the basics of programming with C#</example>
    public string? Description { get; set; }
    
    /// <summary>
    /// Unique invitation code for students to join the course
    /// </summary>
    /// <example>ABC123</example>
    public string InvitationCode { get; set; } = string.Empty;
    
    /// <summary>
    /// Name of the teacher who created the course
    /// </summary>
    /// <example>John Doe</example>
    public string TeacherName { get; set; } = string.Empty;
    
    /// <summary>
    /// ID of the teacher who created the course
    /// </summary>
    /// <example>5</example>
    public int TeacherId { get; set; }
    
    /// <summary>
    /// Current approval status of the course (Pending=0, Approved=1, Rejected=2)
    /// </summary>
    /// <example>Pending</example>
    public CourseStatus Status { get; set; }
    
    /// <summary>
    /// Reason provided by admin if course was rejected (null otherwise)
    /// </summary>
    /// <example>Course content is not appropriate for the platform</example>
    public string? RejectionReason { get; set; }
    
    /// <summary>
    /// Date and time when the course was created
    /// </summary>
    /// <example>2025-10-30T12:00:00Z</example>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Date and time when the course was approved by admin (null if not yet approved)
    /// </summary>
    /// <example>2025-10-30T14:30:00Z</example>
    public DateTime? ApprovedAt { get; set; }
}




