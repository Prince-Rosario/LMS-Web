using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Courses;

/// <summary>
/// DTO for updating course details
/// </summary>
public class UpdateCourseDto
{
    /// <summary>
    /// Updated course title
    /// </summary>
    /// <example>Introduction to Programming - Updated</example>
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Updated course description
    /// </summary>
    /// <example>An updated comprehensive guide to programming</example>
    [StringLength(1000)]
    public string? Description { get; set; }
}




