using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Edify.API.Middleware;

public class TokenBlacklistMiddleware
{
    private readonly RequestDelegate _next;
    
    public TokenBlacklistMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context, IUnitOfWork unitOfWork)
    {
        // Check if the endpoint requires authorization
        var endpoint = context.GetEndpoint();
        var authorizeAttribute = endpoint?.Metadata.GetMetadata<AuthorizeAttribute>();
        
        // If endpoint doesn't require authorization or is the logout endpoint, skip blacklist check
        if (authorizeAttribute == null || context.Request.Path.StartsWithSegments("/api/auth/logout"))
        {
            await _next(context);
            return;
        }
        
        // Extract token from Authorization header
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader != null && authHeader.StartsWith("Bearer "))
        {
            var token = authHeader.Substring("Bearer ".Length).Trim();
            
            // Check if token is blacklisted
            var blacklistedToken = await unitOfWork.BlacklistedTokens.GetAsync(bt => bt.Token == token);
            
            if (blacklistedToken != null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    statusCode = 401,
                    message = "Token has been revoked. Please login again."
                });
                return;
            }
        }
        
        await _next(context);
    }
}





