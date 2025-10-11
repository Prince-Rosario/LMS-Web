using Edify.Core.Enums;

namespace Edify.Core.DTOs.Courses;

public class EnrollmentRequestDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? GroupClass { get; set; }
    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public EnrollmentStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
}




