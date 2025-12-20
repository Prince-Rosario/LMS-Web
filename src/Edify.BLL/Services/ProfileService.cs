using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Profile;
using Edify.Core.Interfaces;

namespace Edify.BLL.Services;

public class ProfileService : IProfileService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProfileService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProfileResponseDto> GetMyProfileAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || !user.IsActive)
        {
            throw new NotFoundException("User not found");
        }

        return new ProfileResponseDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ProfilePictureUrl = user.ProfilePictureUrl,
            PhoneNumber = user.PhoneNumber,
            GroupClass = user.GroupClass,
            Role = user.Role,
            CanTeach = user.CanTeach,
            CanStudy = user.CanStudy,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<ProfileResponseDto> GetUserProfileAsync(int userId)
    {
        // Public profile view (could be restricted in future)
        return await GetMyProfileAsync(userId);
    }

    public async Task<ProfileResponseDto> UpdateMyProfileAsync(int userId, UpdateProfileDto updateDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || !user.IsActive)
        {
            throw new NotFoundException("User not found");
        }

        // Check if email is being changed and if new email already exists
        if (user.Email != updateDto.Email)
        {
            var existingUser = await _unitOfWork.Users.GetAsync(u => u.Email == updateDto.Email && u.Id != userId);
            if (existingUser != null)
            {
                throw new BadRequestException("Email address is already in use by another account");
            }
        }

        // Update user fields
        user.FirstName = updateDto.FirstName;
        user.LastName = updateDto.LastName;
        user.Email = updateDto.Email;
        user.ProfilePictureUrl = updateDto.ProfilePictureUrl;
        user.PhoneNumber = updateDto.PhoneNumber;

        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return await GetMyProfileAsync(userId);
    }
}


