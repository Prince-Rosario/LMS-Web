using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class Enrollment : BaseEntity
{
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
    public DateTime? ApprovedAt { get; set; }
    
    // Navigation properties
    public User Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
}




