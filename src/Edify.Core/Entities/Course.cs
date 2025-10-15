namespace Edify.Core.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string InvitationCode { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public User Teacher { get; set; } = null!;
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}




