using System.ComponentModel.DataAnnotations;
using Edify.Core.Enums;

namespace Edify.Core.DTOs.Materials;

public class UploadMaterialDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    public MaterialType Type { get; set; }
    
    [Required]
    [StringLength(500)]
    public string FileUrl { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string? Topic { get; set; }
    
    [Required]
    public int CourseId { get; set; }
}






