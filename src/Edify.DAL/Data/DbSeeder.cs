using Edify.Core.Entities;
using Edify.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Edify.DAL.Data;

public static class DbSeeder
{
    public static async Task SeedAdminUserAsync(EdifyDbContext context)
    {
        // Check if admin already exists
        var adminExists = await context.Users.AnyAsync(u => u.Email == "admin@edify.com");
        
        if (!adminExists)
        {
            var adminUser = new User
            {
                FirstName = "Edify",
                LastName = "Admin",
                Email = "admin@edify.com",
                // Password: admin@123
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin@123"),
                Role = UserRole.Admin,
                CanTeach = false,
                CanStudy = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();
            
            Console.WriteLine("✅ Admin user seeded successfully!");
            Console.WriteLine("   Email: admin@edify.com");
            Console.WriteLine("   Password: Admin@123");
        }
        else
        {
            Console.WriteLine("ℹ️  Admin user already exists");
        }
    }
}









