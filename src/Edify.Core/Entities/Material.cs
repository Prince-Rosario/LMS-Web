using Edify.Core.Enums;

namespace Edify.Core.Entities;

public class Material : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialType Type { get; set; }
    public string? Topic { get; set; }
    
    // For uploaded files (stored as Base64)
    public string? FileDataBase64 { get; set; }  // Base64 encoded file data
    public string? FileName { get; set; }        // Original filename
    public string? ContentType { get; set; }     // MIME type (e.g., "application/pdf")
    public long? FileSize { get; set; }          // File size in bytes
    
    // For external links (videos, external resources)
    public string? FileUrl { get; set; }         // YouTube, Vimeo, or other external URL
    
    public int CourseId { get; set; }
    public int UploadedByUserId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public Course Course { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
    public ICollection<MaterialProgress> MaterialProgress { get; set; } = new List<MaterialProgress>();
}




