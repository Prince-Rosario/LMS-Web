using System.ComponentModel.DataAnnotations;
using Edify.Core.Enums;

namespace Edify.Core.DTOs.Auth;

/// <summary>
/// DTO for user registration with multi-role support
/// </summary>
public class RegisterDto
{
    /// <summary>
    /// User's first name
    /// </summary>
    /// <example>John</example>
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// User's last name
    /// </summary>
    /// <example>Doe</example>
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;
    
    /// <summary>
    /// User's email address (must be unique)
    /// </summary>
    /// <example>john.doe@university.edu</example>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// User's password (minimum 6 characters)
    /// </summary>
    /// <example>SecurePassword123!</example>
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
    
    /// <summary>
    /// Primary role: Student=0, Teacher=1, Admin=2 (kept for backward compatibility)
    /// </summary>
    /// <example>Student</example>
    [Required]
    public UserRole Role { get; set; }
    
    /// <summary>
    /// Can this user teach courses? Set true for teachers or PhD students who teach
    /// </summary>
    /// <example>false</example>
    public bool CanTeach { get; set; } = false;
    
    /// <summary>
    /// Can this user enroll in courses as a student? Set true for students or teachers taking courses
    /// </summary>
    /// <example>true</example>
    public bool CanStudy { get; set; } = false;
    
    /// <summary>
    /// Optional group/class identifier for students
    /// </summary>
    /// <example>CS-2024-A</example>
    public string? GroupClass { get; set; }
}




