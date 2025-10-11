using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Courses;

public class ApproveEnrollmentDto
{
    [Required]
    public int EnrollmentId { get; set; }
    
    [Required]
    public bool Approve { get; set; }
}




