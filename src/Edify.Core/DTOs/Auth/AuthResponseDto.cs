using Edify.Core.Enums;

namespace Edify.Core.DTOs.Auth;

public class AuthResponseDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? GroupClass { get; set; }
    public string Token { get; set; } = string.Empty;
}



