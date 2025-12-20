using System.Security.Claims;
using Edify.Core.DTOs.Profile;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

/// <summary>
/// User profile management controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    /// <summary>
    /// Get my profile information
    /// </summary>
    /// <returns>Current user's profile</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfileResponseDto>> GetMyProfile()
    {
        var userId = GetUserId();
        var profile = await _profileService.GetMyProfileAsync(userId);
        return Ok(profile);
    }

    /// <summary>
    /// Update my profile information
    /// </summary>
    /// <param name="updateDto">Updated profile information</param>
    /// <returns>Updated profile</returns>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfileResponseDto>> UpdateMyProfile([FromBody] UpdateProfileDto updateDto)
    {
        var userId = GetUserId();
        var profile = await _profileService.UpdateMyProfileAsync(userId, updateDto);
        return Ok(profile);
    }

    /// <summary>
    /// Get any user's public profile (for viewing other users)
    /// </summary>
    /// <param name="userId">User ID to view</param>
    /// <returns>User's public profile</returns>
    [HttpGet("{userId}")]
    [ProducesResponseType(typeof(ProfileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProfileResponseDto>> GetUserProfile(int userId)
    {
        var profile = await _profileService.GetUserProfileAsync(userId);
        return Ok(profile);
    }
}


