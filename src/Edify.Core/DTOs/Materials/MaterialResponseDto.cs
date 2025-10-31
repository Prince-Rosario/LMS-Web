using Edify.Core.Enums;

namespace Edify.Core.DTOs.Materials;

public class MaterialResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialType Type { get; set; }
    public string? Topic { get; set; }
    
    // File information (for Base64 stored files)
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public bool HasFileData { get; set; }  // True if file is stored in DB
    
    // URL information (for videos and external links)
    public string? FileUrl { get; set; }
    
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public bool? IsRead { get; set; }
}




