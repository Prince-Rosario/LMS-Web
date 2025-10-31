using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Courses;

/// <summary>
/// DTO for approving or rejecting a pending course creation request
/// </summary>
public class ApproveCourseDto
{
    /// <summary>
    /// ID of the course to approve or reject
    /// </summary>
    /// <example>1</example>
    [Required]
    public int CourseId { get; set; }
    
    /// <summary>
    /// True to approve the course, false to reject it
    /// </summary>
    /// <example>true</example>
    [Required]
    public bool Approve { get; set; }
    
    /// <summary>
    /// Reason for rejection (required when Approve is false, null when approving)
    /// </summary>
    /// <example>Course content does not meet quality standards</example>
    [StringLength(500)]
    public string? RejectionReason { get; set; }
}



