namespace Edify.Core.Entities;

public class BlacklistedToken : BaseEntity
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Reason { get; set; } = "Logout";
}















