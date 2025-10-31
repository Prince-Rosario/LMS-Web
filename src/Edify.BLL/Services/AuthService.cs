using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Auth;
using Edify.Core.Entities;
using Edify.Core.Enums;
using Edify.Core.Interfaces;

namespace Edify.BLL.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    
    public AuthService(IUnitOfWork unitOfWork, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
    }
    
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        // Block admin registration - admins are seeded only
        if (registerDto.Role == UserRole.Admin)
        {
            throw new BadRequestException("Admin registration is not allowed. Please contact system administrator.");
        }
        
        // Check if user already exists
        var existingUser = await _unitOfWork.Users.GetAsync(u => u.Email == registerDto.Email);
        if (existingUser != null)
        {
            throw new BadRequestException("User with this email already exists");
        }
        
        // Validate that user has at least one capability
        if (!registerDto.CanTeach && !registerDto.CanStudy)
        {
            throw new BadRequestException("User must have at least one capability: CanTeach or CanStudy");
        }
        
        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
        
        // Determine capabilities based on role or explicit flags
        bool canTeach = registerDto.CanTeach || registerDto.Role == UserRole.Teacher;
        bool canStudy = registerDto.CanStudy || registerDto.Role == UserRole.Student;
        
        // Create new user
        var user = new User
        {
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Email = registerDto.Email,
            PasswordHash = passwordHash,
            Role = registerDto.Role,
            GroupClass = registerDto.GroupClass,
            CanTeach = canTeach,
            CanStudy = canStudy
        };
        
        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();
        
        // Generate token
        var token = _tokenService.GenerateToken(user);
        
        return new AuthResponseDto
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Role = user.Role,
            CanTeach = user.CanTeach,
            CanStudy = user.CanStudy,
            GroupClass = user.GroupClass,
            Token = token
        };
    }
    
    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _unitOfWork.Users.GetAsync(u => u.Email == loginDto.Email);
        
        if (user == null)
        {
            throw new UnauthorizedException("Invalid email or password");
        }
        
        if (!user.IsActive)
        {
            throw new UnauthorizedException("Account is inactive");
        }
        
        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password");
        }
        
        // Generate token
        var token = _tokenService.GenerateToken(user);
        
        return new AuthResponseDto
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Role = user.Role,
            CanTeach = user.CanTeach,
            CanStudy = user.CanStudy,
            GroupClass = user.GroupClass,
            Token = token
        };
    }
    
    public async Task LogoutAsync(string token)
    {
        // Validate token and extract user information
        var claimsPrincipal = _tokenService.ValidateToken(token);
        if (claimsPrincipal == null)
        {
            throw new UnauthorizedException("Invalid token");
        }
        
        // Try to get user ID from different claim types (ASP.NET Core maps 'sub' to NameIdentifier)
        var userIdClaim = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier) 
                          ?? claimsPrincipal.FindFirst(JwtRegisteredClaimNames.Sub)
                          ?? claimsPrincipal.FindFirst("sub");
        
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedException("Invalid token claims");
        }
        
        // Get token expiration
        var expiresAt = _tokenService.GetTokenExpiration(token);
        if (expiresAt == null)
        {
            throw new BadRequestException("Unable to determine token expiration");
        }
        
        // Check if token is already blacklisted
        var existingBlacklistedToken = await _unitOfWork.BlacklistedTokens.GetAsync(bt => bt.Token == token);
        if (existingBlacklistedToken != null)
        {
            return; // Token is already blacklisted
        }
        
        // Create blacklisted token entry
        var blacklistedToken = new BlacklistedToken
        {
            Token = token,
            UserId = userId,
            ExpiresAt = expiresAt.Value,
            Reason = "Logout"
        };
        
        await _unitOfWork.BlacklistedTokens.AddAsync(blacklistedToken);
        await _unitOfWork.SaveChangesAsync();
    }
}


