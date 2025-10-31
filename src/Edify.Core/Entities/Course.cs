using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string InvitationCode { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Admin approval workflow
    public CourseStatus Status { get; set; } = CourseStatus.Pending;
    public int? ApprovedByAdminId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    
    // Navigation properties
    public User Teacher { get; set; } = null!;
    public User? ApprovedByAdmin { get; set; }
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Material> Materials { get; set; } = new List<Material>();
}




