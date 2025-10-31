using Edify.Core.Enums;

namespace Edify.Core.DTOs.Auth;

/// <summary>
/// DTO for authentication response containing user details and JWT token
/// </summary>
public class AuthResponseDto
{
    /// <summary>
    /// Unique user identifier
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// User's first name
    /// </summary>
    public string FirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// User's last name
    /// </summary>
    public string LastName { get; set; } = string.Empty;
    
    /// <summary>
    /// User's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Primary role (kept for backward compatibility)
    /// </summary>
    public UserRole Role { get; set; }
    
    /// <summary>
    /// Can this user teach courses?
    /// </summary>
    public bool CanTeach { get; set; }
    
    /// <summary>
    /// Can this user enroll in courses as a student?
    /// </summary>
    public bool CanStudy { get; set; }
    
    /// <summary>
    /// User's group/class (if applicable)
    /// </summary>
    public string? GroupClass { get; set; }
    
    /// <summary>
    /// JWT authentication token
    /// </summary>
    public string Token { get; set; } = string.Empty;
}




