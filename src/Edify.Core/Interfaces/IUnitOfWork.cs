using Edify.Core.Entities;

namespace Edify.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Course> Courses { get; }
    IRepository<Enrollment> Enrollments { get; }
    IRepository<BlacklistedToken> BlacklistedTokens { get; }
    Task<int> SaveChangesAsync();
}


