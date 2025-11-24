using System.ComponentModel.DataAnnotations;
using Edify.Core.Validation;

namespace Edify.Core.DTOs.Materials;

/// <summary>
/// DTO for adding video links (YouTube, Vimeo, etc.)
/// Supported platforms: YouTube, Vimeo, Dailymotion, Twitch, Wistia, Loom, Vidyard, Google Drive, Microsoft Stream, Kaltura, Panopto, Zoom
/// </summary>
public class AddVideoLinkDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [VideoUrl]
    [StringLength(500)]
    public string VideoUrl { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string? Topic { get; set; }
    
    [Required]
    public int CourseId { get; set; }
}








