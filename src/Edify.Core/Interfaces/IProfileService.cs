using Edify.Core.DTOs.Profile;

namespace Edify.Core.Interfaces;

public interface IProfileService
{
    Task<ProfileResponseDto> GetMyProfileAsync(int userId);
    Task<ProfileResponseDto> GetUserProfileAsync(int userId);
    Task<ProfileResponseDto> UpdateMyProfileAsync(int userId, UpdateProfileDto updateDto);
}


