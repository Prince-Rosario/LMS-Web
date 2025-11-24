using Edify.Core.Entities;
using Edify.Core.Interfaces;
using Edify.DAL.Data;

namespace Edify.DAL.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly EdifyDbContext _context;
    
    public IRepository<User> Users { get; }
    public IRepository<Course> Courses { get; }
    public IRepository<Enrollment> Enrollments { get; }
    public IRepository<Material> Materials { get; }
    public IRepository<MaterialProgress> MaterialProgress { get; }
    public IRepository<BlacklistedToken> BlacklistedTokens { get; }
    
    // Tests
    public IRepository<Test> Tests { get; }
    public IRepository<Question> Questions { get; }
    public IRepository<AnswerOption> AnswerOptions { get; }
    public IRepository<TestAttempt> TestAttempts { get; }
    public IRepository<StudentAnswer> StudentAnswers { get; }
    
    // Chat
    public IRepository<ChatRoom> ChatRooms { get; }
    public IRepository<ChatMessage> ChatMessages { get; }
    
    // Comments
    public IRepository<Comment> Comments { get; }
    
    public UnitOfWork(EdifyDbContext context)
    {
        _context = context;
        Users = new Repository<User>(context);
        Courses = new Repository<Course>(context);
        Enrollments = new Repository<Enrollment>(context);
        Materials = new Repository<Material>(context);
        MaterialProgress = new Repository<MaterialProgress>(context);
        BlacklistedTokens = new Repository<BlacklistedToken>(context);
        
        // Tests
        Tests = new Repository<Test>(context);
        Questions = new Repository<Question>(context);
        AnswerOptions = new Repository<AnswerOption>(context);
        TestAttempts = new Repository<TestAttempt>(context);
        StudentAnswers = new Repository<StudentAnswer>(context);
        
        // Chat
        ChatRooms = new Repository<ChatRoom>(context);
        ChatMessages = new Repository<ChatMessage>(context);
        
        // Comments
        Comments = new Repository<Comment>(context);
    }
    
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
    
    public void Dispose()
    {
        _context.Dispose();
    }
}


