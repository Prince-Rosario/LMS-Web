namespace Edify.Core.Entities;

public class MaterialProgress : BaseEntity
{
    public int MaterialId { get; set; }
    public int StudentId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    
    // Navigation properties
    public Material Material { get; set; } = null!;
    public User Student { get; set; } = null!;
}











