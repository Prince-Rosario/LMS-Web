using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Courses;

public class CreateCourseDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [StringLength(1000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;
}




