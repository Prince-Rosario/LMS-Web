using Edify.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Edify.DAL.Data;

public class EdifyDbContext : DbContext
{
    public EdifyDbContext(DbContextOptions<EdifyDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Enrollment> Enrollments { get; set; }
    public DbSet<Material> Materials { get; set; }
    public DbSet<MaterialProgress> MaterialProgress { get; set; }
    public DbSet<BlacklistedToken> BlacklistedTokens { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.GroupClass).HasMaxLength(50);
        });
        
        // Course configuration
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvitationCode).IsUnique();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.InvitationCode).IsRequired().HasMaxLength(10);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            
            entity.HasOne(e => e.Teacher)
                .WithMany(u => u.CreatedCourses)
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.ApprovedByAdmin)
                .WithMany()
                .HasForeignKey(e => e.ApprovedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Enrollment configuration
        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();
            
            entity.HasOne(e => e.Student)
                .WithMany(u => u.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Material configuration
        modelBuilder.Entity<Material>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.FileUrl).HasMaxLength(500);
            entity.Property(e => e.Topic).HasMaxLength(100);
            
            entity.HasOne(e => e.Course)
                .WithMany(c => c.Materials)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.UploadedBy)
                .WithMany(u => u.UploadedMaterials)
                .HasForeignKey(e => e.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // MaterialProgress configuration
        modelBuilder.Entity<MaterialProgress>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.MaterialId, e.StudentId }).IsUnique();
            
            entity.HasOne(e => e.Material)
                .WithMany(m => m.MaterialProgress)
                .HasForeignKey(e => e.MaterialId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Student)
                .WithMany(u => u.MaterialProgress)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // BlacklistedToken configuration
        modelBuilder.Entity<BlacklistedToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.ExpiresAt);
            entity.Property(e => e.Token).IsRequired();
            entity.Property(e => e.Reason).HasMaxLength(100);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && e.State == EntityState.Modified);
        
        foreach (var entry in entries)
        {
            ((BaseEntity)entry.Entity).UpdatedAt = DateTime.UtcNow;
        }
        
        return base.SaveChangesAsync(cancellationToken);
    }
}


