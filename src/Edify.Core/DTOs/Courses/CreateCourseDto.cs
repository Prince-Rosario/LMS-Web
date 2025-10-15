using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Courses;

public class CreateCourseDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
}




