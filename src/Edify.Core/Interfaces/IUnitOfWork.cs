using Edify.Core.Entities;

namespace Edify.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Course> Courses { get; }
    IRepository<Enrollment> Enrollments { get; }
    IRepository<Material> Materials { get; }
    IRepository<MaterialProgress> MaterialProgress { get; }
    IRepository<BlacklistedToken> BlacklistedTokens { get; }
    
    // Tests
    IRepository<Test> Tests { get; }
    IRepository<Question> Questions { get; }
    IRepository<AnswerOption> AnswerOptions { get; }
    IRepository<TestAttempt> TestAttempts { get; }
    IRepository<StudentAnswer> StudentAnswers { get; }
    
    // Chat
    IRepository<ChatRoom> ChatRooms { get; }
    IRepository<ChatMessage> ChatMessages { get; }
    
    // Comments
    IRepository<Comment> Comments { get; }
    
    Task<int> SaveChangesAsync();
}


