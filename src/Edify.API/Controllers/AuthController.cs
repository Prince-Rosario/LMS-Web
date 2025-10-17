using Edify.Core.DTOs.Auth;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

/// <summary>
/// Authentication controller for user registration, login, and logout operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    
    /// <summary>
    /// Register a new user account (Teacher or Student)
    /// </summary>
    /// <param name="registerDto">Registration details including email, password, full name, and role</param>
    /// <returns>Authentication response with JWT token and user information</returns>
    /// <response code="200">Returns the authentication token and user details</response>
    /// <response code="400">If the registration data is invalid or email already exists</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        var response = await _authService.RegisterAsync(registerDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Authenticate user and generate JWT token
    /// </summary>
    /// <param name="loginDto">Login credentials (email and password)</param>
    /// <returns>Authentication response with JWT token and user information</returns>
    /// <response code="200">Returns the authentication token and user details</response>
    /// <response code="401">If the credentials are invalid</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var response = await _authService.LoginAsync(loginDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Logout the current user and invalidate their JWT token
    /// </summary>
    /// <returns>Success message</returns>
    /// <response code="200">User successfully logged out and token blacklisted</response>
    /// <response code="400">If no token is provided</response>
    /// <response code="401">If the token is invalid or expired</response>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> Logout()
    {
        // Extract token from Authorization header
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader == null || !authHeader.StartsWith("Bearer "))
        {
            return BadRequest(new { message = "No token provided" });
        }
        
        var token = authHeader.Substring("Bearer ".Length).Trim();
        await _authService.LogoutAsync(token);
        
        return Ok(new { message = "Logged out successfully" });
    }
}


