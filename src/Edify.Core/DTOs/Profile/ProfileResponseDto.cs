using Edify.Core.Enums;

namespace Edify.Core.DTOs.Profile;

public class ProfileResponseDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string? GroupClass { get; set; }
    public UserRole Role { get; set; }
    public bool CanTeach { get; set; }
    public bool CanStudy { get; set; }
    public DateTime CreatedAt { get; set; }
}


