using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Courses;

public class JoinCourseDto
{
    [Required]
    [StringLength(10, MinimumLength = 6)]
    public string InvitationCode { get; set; } = string.Empty;
}




