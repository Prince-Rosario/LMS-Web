using System.ComponentModel.DataAnnotations;

namespace Edify.Core.DTOs.Materials;

public class MarkAsReadDto
{
    [Required]
    public int MaterialId { get; set; }
}






