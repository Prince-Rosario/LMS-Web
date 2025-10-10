using System.Security.Claims;
using Edify.Core.Entities;

namespace Edify.Core.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
    DateTime? GetTokenExpiration(string token);
}


