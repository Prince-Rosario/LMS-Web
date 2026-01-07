using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Profile;

public class UpdateProfileDto
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? ProfilePictureUrl { get; set; }
    
    [StringLength(20)]
    public string? PhoneNumber { get; set; }
}


