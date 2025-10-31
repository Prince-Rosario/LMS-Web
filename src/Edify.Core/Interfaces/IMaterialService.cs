using Edify.Core.DTOs.Materials;

namespace Edify.Core.Interfaces;

public interface IMaterialService
{
    Task<MaterialResponseDto> UploadMaterialAsync(int userId, UploadMaterialDto uploadDto);
    Task<MaterialResponseDto> UploadFileAsync(int userId, UploadFileDto uploadDto);
    Task<MaterialResponseDto> AddVideoLinkAsync(int userId, AddVideoLinkDto videoDto);
    Task<MaterialResponseDto> CreatePostAsync(int userId, CreatePostDto postDto);
    Task<byte[]> DownloadFileAsync(int materialId, int userId);
    Task<MaterialResponseDto> GetMaterialByIdAsync(int materialId, int? userId = null);
    Task<IEnumerable<MaterialResponseDto>> GetCourseMaterialsAsync(int courseId, int? userId = null, string? topic = null);
    Task<MaterialResponseDto> UpdateMaterialAsync(int materialId, int userId, UpdateMaterialDto updateDto);
    Task DeleteMaterialAsync(int materialId, int userId);
    Task MarkAsReadAsync(int userId, MarkAsReadDto markAsReadDto);
    Task<IEnumerable<MaterialResponseDto>> GetMyMaterialsAsync(int userId, int? courseId = null);
}




