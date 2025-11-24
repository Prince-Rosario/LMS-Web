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
    
    // Tests
    public DbSet<Test> Tests { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<AnswerOption> AnswerOptions { get; set; }
    public DbSet<TestAttempt> TestAttempts { get; set; }
    public DbSet<StudentAnswer> StudentAnswers { get; set; }
    
    // Chat
    public DbSet<ChatRoom> ChatRooms { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    
    // Comments
    public DbSet<Comment> Comments { get; set; }
    
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
        
        // Test configuration
        modelBuilder.Entity<Test>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Instructions).HasMaxLength(2000);
            entity.Property(e => e.PassingScore).HasPrecision(5, 2);
            
            entity.HasOne(e => e.Course)
                .WithMany()
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Question configuration
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuestionText).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Explanation).HasMaxLength(1000);
            entity.Property(e => e.CorrectShortAnswer).HasMaxLength(500);
            entity.Property(e => e.Points).HasPrecision(5, 2);
            
            entity.HasOne(e => e.Test)
                .WithMany(t => t.Questions)
                .HasForeignKey(e => e.TestId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // AnswerOption configuration
        modelBuilder.Entity<AnswerOption>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OptionText).IsRequired().HasMaxLength(1000);
            
            entity.HasOne(e => e.Question)
                .WithMany(q => q.AnswerOptions)
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // TestAttempt configuration
        modelBuilder.Entity<TestAttempt>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Score).HasPrecision(10, 2);
            entity.Property(e => e.MaxScore).HasPrecision(10, 2);
            entity.Property(e => e.Percentage).HasPrecision(5, 2);
            entity.Property(e => e.Feedback).HasMaxLength(2000);
            
            entity.HasOne(e => e.Test)
                .WithMany(t => t.Attempts)
                .HasForeignKey(e => e.TestId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.GradedBy)
                .WithMany()
                .HasForeignKey(e => e.GradedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // StudentAnswer configuration
        modelBuilder.Entity<StudentAnswer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TextAnswer).HasMaxLength(10000);
            entity.Property(e => e.SelectedOptionIds).HasMaxLength(500);
            entity.Property(e => e.PointsEarned).HasPrecision(5, 2);
            entity.Property(e => e.Feedback).HasMaxLength(1000);
            
            entity.HasOne(e => e.TestAttempt)
                .WithMany(a => a.Answers)
                .HasForeignKey(e => e.TestAttemptId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Question)
                .WithMany(q => q.StudentAnswers)
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // ChatRoom configuration
        modelBuilder.Entity<ChatRoom>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.CourseId).IsUnique();
            
            entity.HasOne(e => e.Course)
                .WithMany()
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // ChatMessage configuration
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(4000);
            
            entity.HasOne(e => e.ChatRoom)
                .WithMany(r => r.Messages)
                .HasForeignKey(e => e.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Sender)
                .WithMany()
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.ReplyToMessage)
                .WithMany(m => m.Replies)
                .HasForeignKey(e => e.ReplyToMessageId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Comment configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
            entity.HasIndex(e => new { e.CommentableType, e.CommentableId });
            
            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(e => e.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
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


