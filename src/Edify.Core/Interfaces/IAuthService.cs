using Edify.Core.DTOs.Auth;

namespace Edify.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task LogoutAsync(string token);
}


