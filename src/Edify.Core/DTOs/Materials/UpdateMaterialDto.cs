using System.ComponentModel.DataAnnotations;
using Edify.Core.Enums;

namespace Edify.Core.DTOs.Materials;

public class UpdateMaterialDto
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    public MaterialType? Type { get; set; }
    
    [StringLength(500)]
    public string? FileUrl { get; set; }
    
    [StringLength(100)]
    public string? Topic { get; set; }
}











