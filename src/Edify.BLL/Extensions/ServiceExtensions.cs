using Edify.BLL.Services;
using Edify.Core.Interfaces;
using Edify.DAL.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace Edify.BLL.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddBusinessLogicServices(this IServiceCollection services)
    {
        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Register Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<ITokenService, TokenService>();
        
        return services;
    }
}




