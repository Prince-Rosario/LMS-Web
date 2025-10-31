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
    
    public UnitOfWork(EdifyDbContext context)
    {
        _context = context;
        Users = new Repository<User>(context);
        Courses = new Repository<Course>(context);
        Enrollments = new Repository<Enrollment>(context);
        Materials = new Repository<Material>(context);
        MaterialProgress = new Repository<MaterialProgress>(context);
        BlacklistedTokens = new Repository<BlacklistedToken>(context);
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


