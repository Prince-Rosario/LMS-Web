using System.ComponentModel.DataAnnotations;
using Edify.Core.Enums;

namespace Edify.Core.DTOs.Materials;

/// <summary>
/// DTO for uploading files as Base64 (images, PDFs, documents)
/// </summary>
public class UploadFileDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; } = null;
    
    [Required]
    public int Type { get; set; }  // Using int instead of enum for easier frontend integration
    
    [Required]
    public string FileDataBase64 { get; set; } = string.Empty;  // Base64 encoded file
    
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    public string ContentType { get; set; } = string.Empty;     // MIME type
    
    [StringLength(100)]
    public string? Topic { get; set; } = null;
    
    [Required]
    public int CourseId { get; set; }
}


