using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? GroupClass { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Multi-role support
    public bool CanTeach { get; set; } = false;
    public bool CanStudy { get; set; } = false;
    
    // Navigation properties
    public ICollection<Course> CreatedCourses { get; set; } = new List<Course>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Material> UploadedMaterials { get; set; } = new List<Material>();
    public ICollection<MaterialProgress> MaterialProgress { get; set; } = new List<MaterialProgress>();
}




