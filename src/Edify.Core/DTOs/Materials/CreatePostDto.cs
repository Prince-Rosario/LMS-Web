using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Materials;

/// <summary>
/// DTO for creating text posts/announcements with optional attachments
/// </summary>
public class CreatePostDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [StringLength(100)]
    public string? Topic { get; set; }
    
    [Required]
    public int CourseId { get; set; }
    
    // Optional file attachment (Base64)
    public string? FileDataBase64 { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    
    // Optional link attachment
    [StringLength(500)]
    public string? AttachmentUrl { get; set; }
}

