namespace Edify.Core.DTOs.Courses;

public class CourseResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string InvitationCode { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public DateTime CreatedAt { get; set; }
}




