using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Materials;
using Edify.Core.Entities;
using Edify.Core.Enums;
using Edify.Core.Interfaces;
using Edify.Core.Validation;

namespace Edify.BLL.Services;

public class MaterialService : IMaterialService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService? _notificationService;
    
    public MaterialService(IUnitOfWork unitOfWork, INotificationService? notificationService = null)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }
    
    public async Task<MaterialResponseDto> UploadMaterialAsync(int userId, UploadMaterialDto uploadDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || (!user.CanTeach && user.Role != UserRole.Teacher))
        {
            throw new UnauthorizedException("Only teachers can upload materials");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(uploadDto.CourseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.TeacherId != userId)
        {
            throw new UnauthorizedException("You are not authorized to upload materials to this course");
        }
        
        var material = new Material
        {
            Title = uploadDto.Title,
            Description = uploadDto.Description,
            Type = uploadDto.Type,
            FileUrl = uploadDto.FileUrl,
            Topic = uploadDto.Topic,
            CourseId = uploadDto.CourseId,
            UploadedByUserId = userId
        };
        
        await _unitOfWork.Materials.AddAsync(material);
        await _unitOfWork.SaveChangesAsync();
        
        // Send real-time notification to all enrolled students
        if (_notificationService != null)
        {
            try
            {
                await _notificationService.NotifyMaterialPublishedAsync(
                    material.CourseId,
                    material.Id,
                    material.Title,
                    material.Type.ToString(),
                    $"{user.FirstName} {user.LastName}",
                    material.CreatedAt
                );
            }
            catch
            {
                // Notification failure shouldn't break the upload
            }
        }
        
        return new MaterialResponseDto
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileUrl = material.FileUrl,
            Topic = material.Topic,
            CourseId = material.CourseId,
            CourseName = course.Title,
            UploadedBy = $"{user.FirstName} {user.LastName}",
            UploadedAt = material.CreatedAt,
            IsRead = null
        };
    }
    
    public async Task<MaterialResponseDto> UploadFileAsync(int userId, UploadFileDto uploadDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || !user.CanTeach)
        {
            throw new UnauthorizedException("Only teachers can upload materials");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(uploadDto.CourseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.TeacherId != userId)
        {
            throw new UnauthorizedException("You are not authorized to upload materials to this course");
        }
        
        // Validate file size (limit to 50MB for Base64 storage)
        var fileBytes = Convert.FromBase64String(uploadDto.FileDataBase64);
        if (fileBytes.Length > 50 * 1024 * 1024) // 50MB
        {
            throw new BadRequestException("File size exceeds 50MB limit for database storage");
        }
        
        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "application/pdf", 
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
        
        if (!allowedTypes.Contains(uploadDto.ContentType.ToLowerInvariant()))
        {
            throw new BadRequestException("Invalid file type. Only images, PDFs, Word, and PowerPoint files are allowed.");
        }
        
        var material = new Material
        {
            Title = uploadDto.Title,
            Description = string.IsNullOrWhiteSpace(uploadDto.Description) ? null : uploadDto.Description,
            Type = (MaterialType)uploadDto.Type,
            FileDataBase64 = uploadDto.FileDataBase64,
            FileName = uploadDto.FileName,
            ContentType = uploadDto.ContentType,
            FileSize = fileBytes.Length,
            Topic = string.IsNullOrWhiteSpace(uploadDto.Topic) ? null : uploadDto.Topic,
            CourseId = uploadDto.CourseId,
            UploadedByUserId = userId
        };
        
        await _unitOfWork.Materials.AddAsync(material);
        await _unitOfWork.SaveChangesAsync();
        
        return new MaterialResponseDto
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileName = material.FileName,
            ContentType = material.ContentType,
            FileSize = material.FileSize,
            HasFileData = true,
            Topic = material.Topic,
            CourseId = material.CourseId,
            CourseName = course.Title,
            UploadedBy = $"{user.FirstName} {user.LastName}",
            UploadedAt = material.CreatedAt,
            IsRead = null
        };
    }
    
    public async Task<MaterialResponseDto> AddVideoLinkAsync(int userId, AddVideoLinkDto videoDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || !user.CanTeach)
        {
            throw new UnauthorizedException("Only teachers can add video links");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(videoDto.CourseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.TeacherId != userId)
        {
            throw new UnauthorizedException("You are not authorized to add materials to this course");
        }
        
        // Validate video URL is from a supported platform
        if (!VideoUrlAttribute.IsValidVideoUrl(videoDto.VideoUrl))
        {
            throw new BadRequestException($"Invalid video URL. Only links from supported platforms are allowed: {string.Join(", ", VideoUrlAttribute.SupportedPlatforms)}");
        }
        
        var material = new Material
        {
            Title = videoDto.Title,
            Description = videoDto.Description,
            Type = MaterialType.Video,
            FileUrl = videoDto.VideoUrl,
            Topic = videoDto.Topic,
            CourseId = videoDto.CourseId,
            UploadedByUserId = userId
        };
        
        await _unitOfWork.Materials.AddAsync(material);
        await _unitOfWork.SaveChangesAsync();
        
        return new MaterialResponseDto
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileUrl = material.FileUrl,
            HasFileData = false,
            Topic = material.Topic,
            CourseId = material.CourseId,
            CourseName = course.Title,
            UploadedBy = $"{user.FirstName} {user.LastName}",
            UploadedAt = material.CreatedAt,
            IsRead = null
        };
    }
    
    public async Task<MaterialResponseDto> CreatePostAsync(int userId, CreatePostDto postDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || !user.CanTeach)
        {
            throw new UnauthorizedException("Only teachers can create posts");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(postDto.CourseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.TeacherId != userId)
        {
            throw new UnauthorizedException("You are not authorized to create posts in this course");
        }
        
        var material = new Material
        {
            Title = postDto.Title,
            Description = postDto.Description,
            Type = MaterialType.Post,
            Topic = postDto.Topic,
            CourseId = postDto.CourseId,
            UploadedByUserId = userId
        };
        
        // Handle optional file attachment
        if (!string.IsNullOrWhiteSpace(postDto.FileDataBase64))
        {
            var fileBytes = Convert.FromBase64String(postDto.FileDataBase64);
            
            // Validate file size (limit to 50MB)
            if (fileBytes.Length > 50 * 1024 * 1024)
            {
                throw new BadRequestException("File size exceeds 50MB limit");
            }
            
            material.FileDataBase64 = postDto.FileDataBase64;
            material.FileName = postDto.FileName;
            material.ContentType = postDto.ContentType;
            material.FileSize = fileBytes.Length;
        }
        
        // Handle optional link attachment
        if (!string.IsNullOrWhiteSpace(postDto.AttachmentUrl))
        {
            material.FileUrl = postDto.AttachmentUrl;
        }
        
        await _unitOfWork.Materials.AddAsync(material);
        await _unitOfWork.SaveChangesAsync();
        
        return new MaterialResponseDto
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileName = material.FileName,
            ContentType = material.ContentType,
            FileSize = material.FileSize,
            HasFileData = !string.IsNullOrWhiteSpace(material.FileDataBase64),
            FileUrl = material.FileUrl,
            Topic = material.Topic,
            CourseId = material.CourseId,
            CourseName = course.Title,
            UploadedBy = $"{user.FirstName} {user.LastName}",
            UploadedAt = material.CreatedAt,
            IsRead = null
        };
    }
    
    public async Task<byte[]> DownloadFileAsync(int materialId, int userId)
    {
        var material = await _unitOfWork.Materials.GetByIdAsync(materialId);
        
        if (material == null || !material.IsActive)
        {
            throw new NotFoundException("Material not found");
        }
        
        if (string.IsNullOrEmpty(material.FileDataBase64))
        {
            throw new BadRequestException("This material does not have downloadable file data");
        }
        
        // Verify user has access to the course
        var course = await _unitOfWork.Courses.GetByIdAsync(material.CourseId);
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        // Check if user is teacher of the course or enrolled student
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found");
        }
        
        bool hasAccess = false;
        if (course.TeacherId == userId)
        {
            hasAccess = true;
        }
        else
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == course.Id && e.Status == EnrollmentStatus.Approved);
            hasAccess = enrollment != null;
        }
        
        if (!hasAccess)
        {
            throw new UnauthorizedException("You do not have access to this material");
        }
        
        return Convert.FromBase64String(material.FileDataBase64);
    }
    
    public async Task<MaterialResponseDto> GetMaterialByIdAsync(int materialId, int? userId = null)
    {
        var material = await _unitOfWork.Materials.GetByIdAsync(materialId);
        
        if (material == null || !material.IsActive)
        {
            throw new NotFoundException("Material not found");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(material.CourseId);
        var uploader = await _unitOfWork.Users.GetByIdAsync(material.UploadedByUserId);
        
        bool? isRead = null;
        if (userId.HasValue)
        {
            var progress = await _unitOfWork.MaterialProgress.GetAsync(
                mp => mp.MaterialId == materialId && mp.StudentId == userId.Value);
            isRead = progress?.IsRead;
        }
        
        return new MaterialResponseDto
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileName = material.FileName,
            ContentType = material.ContentType,
            FileSize = material.FileSize,
            HasFileData = !string.IsNullOrEmpty(material.FileDataBase64),
            FileUrl = material.FileUrl,
            Topic = material.Topic,
            CourseId = material.CourseId,
            CourseName = course?.Title ?? "",
            UploadedBy = $"{uploader?.FirstName} {uploader?.LastName}",
            UploadedAt = material.CreatedAt,
            IsRead = isRead
        };
    }
    
    public async Task<IEnumerable<MaterialResponseDto>> GetCourseMaterialsAsync(int courseId, int? userId = null, string? topic = null)
    {
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        var materials = await _unitOfWork.Materials.FindAsync(m => m.CourseId == courseId && m.IsActive);
        
        if (!string.IsNullOrEmpty(topic))
        {
            materials = materials.Where(m => m.Topic == topic);
        }
        
        var materialDtos = new List<MaterialResponseDto>();
        
        foreach (var material in materials.OrderBy(m => m.Topic).ThenByDescending(m => m.CreatedAt))
        {
            var uploader = await _unitOfWork.Users.GetByIdAsync(material.UploadedByUserId);
            
            bool? isRead = null;
            if (userId.HasValue)
            {
                var progress = await _unitOfWork.MaterialProgress.GetAsync(
                    mp => mp.MaterialId == material.Id && mp.StudentId == userId.Value);
                isRead = progress?.IsRead;
            }
            
            materialDtos.Add(new MaterialResponseDto
            {
                Id = material.Id,
                Title = material.Title,
                Description = material.Description,
                Type = material.Type,
                FileName = material.FileName,
                ContentType = material.ContentType,
                FileSize = material.FileSize,
                HasFileData = !string.IsNullOrEmpty(material.FileDataBase64),
                FileUrl = material.FileUrl,
                Topic = material.Topic,
                CourseId = material.CourseId,
                CourseName = course.Title,
                UploadedBy = $"{uploader?.FirstName} {uploader?.LastName}",
                UploadedAt = material.CreatedAt,
                IsRead = isRead
            });
        }
        
        return materialDtos;
    }
    
    public async Task<MaterialResponseDto> UpdateMaterialAsync(int materialId, int userId, UpdateMaterialDto updateDto)
    {
        var material = await _unitOfWork.Materials.GetByIdAsync(materialId);
        
        if (material == null || !material.IsActive)
        {
            throw new NotFoundException("Material not found");
        }
        
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        var course = await _unitOfWork.Courses.GetByIdAsync(material.CourseId);
        
        if (course == null || course.TeacherId != userId)
        {
            throw new UnauthorizedException("You are not authorized to update this material");
        }
        
        if (!string.IsNullOrEmpty(updateDto.Title))
            material.Title = updateDto.Title;
        
        if (updateDto.Description != null)
            material.Description = updateDto.Description;
        
        if (updateDto.Type.HasValue)
            material.Type = updateDto.Type.Value;
        
        if (!string.IsNullOrEmpty(updateDto.FileUrl))
            material.FileUrl = updateDto.FileUrl;
        
        if (updateDto.Topic != null)
            material.Topic = updateDto.Topic;
        
        await _unitOfWork.Materials.UpdateAsync(material);
        await _unitOfWork.SaveChangesAsync();
        
        return new MaterialResponseDto
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileUrl = material.FileUrl,
            Topic = material.Topic,
            CourseId = material.CourseId,
            CourseName = course.Title,
            UploadedBy = $"{user?.FirstName} {user?.LastName}",
            UploadedAt = material.CreatedAt
        };
    }
    
    public async Task DeleteMaterialAsync(int materialId, int userId)
    {
        var material = await _unitOfWork.Materials.GetByIdAsync(materialId);
        
        if (material == null || !material.IsActive)
        {
            throw new NotFoundException("Material not found");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(material.CourseId);
        
        if (course == null || course.TeacherId != userId)
        {
            throw new UnauthorizedException("You are not authorized to delete this material");
        }
        
        material.IsActive = false;
        await _unitOfWork.Materials.UpdateAsync(material);
        await _unitOfWork.SaveChangesAsync();
    }
    
    public async Task MarkAsReadAsync(int userId, MarkAsReadDto markAsReadDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null || (!user.CanStudy && user.Role != UserRole.Student))
        {
            throw new UnauthorizedException("Only students can mark materials as read");
        }
        
        var material = await _unitOfWork.Materials.GetByIdAsync(markAsReadDto.MaterialId);
        
        if (material == null || !material.IsActive)
        {
            throw new NotFoundException("Material not found");
        }
        
        // Check if student is enrolled in the course
        var enrollment = await _unitOfWork.Enrollments.GetAsync(
            e => e.StudentId == userId && e.CourseId == material.CourseId && e.Status == EnrollmentStatus.Approved);
        
        if (enrollment == null)
        {
            throw new UnauthorizedException("You must be enrolled in the course to mark materials as read");
        }
        
        var progress = await _unitOfWork.MaterialProgress.GetAsync(
            mp => mp.MaterialId == markAsReadDto.MaterialId && mp.StudentId == userId);
        
        if (progress == null)
        {
            progress = new MaterialProgress
            {
                MaterialId = markAsReadDto.MaterialId,
                StudentId = userId,
                IsRead = true,
                ReadAt = DateTime.UtcNow
            };
            await _unitOfWork.MaterialProgress.AddAsync(progress);
        }
        else
        {
            progress.IsRead = true;
            progress.ReadAt = DateTime.UtcNow;
            await _unitOfWork.MaterialProgress.UpdateAsync(progress);
        }
        
        await _unitOfWork.SaveChangesAsync();
    }
    
    public async Task<IEnumerable<MaterialResponseDto>> GetMyMaterialsAsync(int userId, int? courseId = null)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new NotFoundException("User not found");
        }
        
        // If teacher, return materials they uploaded
        if (user.CanTeach)
        {
            var materials = courseId.HasValue
                ? await _unitOfWork.Materials.FindAsync(m => m.UploadedByUserId == userId && m.CourseId == courseId.Value && m.IsActive)
                : await _unitOfWork.Materials.FindAsync(m => m.UploadedByUserId == userId && m.IsActive);
            
            var materialDtos = new List<MaterialResponseDto>();
            
            foreach (var material in materials.OrderBy(m => m.Topic).ThenByDescending(m => m.CreatedAt))
            {
                var course = await _unitOfWork.Courses.GetByIdAsync(material.CourseId);
                
                materialDtos.Add(new MaterialResponseDto
                {
                    Id = material.Id,
                    Title = material.Title,
                    Description = material.Description,
                    Type = material.Type,
                    FileUrl = material.FileUrl,
                    Topic = material.Topic,
                    CourseId = material.CourseId,
                    CourseName = course?.Title ?? "",
                    UploadedBy = $"{user.FirstName} {user.LastName}",
                    UploadedAt = material.CreatedAt
                });
            }
            
            return materialDtos;
        }
        
        // If student, return materials from enrolled courses with progress
        var enrollments = courseId.HasValue
            ? await _unitOfWork.Enrollments.FindAsync(e => e.StudentId == userId && e.CourseId == courseId.Value && e.Status == EnrollmentStatus.Approved)
            : await _unitOfWork.Enrollments.FindAsync(e => e.StudentId == userId && e.Status == EnrollmentStatus.Approved);
        
        var studentMaterialDtos = new List<MaterialResponseDto>();
        
        foreach (var enrollment in enrollments)
        {
            var courseMaterials = await _unitOfWork.Materials.FindAsync(m => m.CourseId == enrollment.CourseId && m.IsActive);
            var course = await _unitOfWork.Courses.GetByIdAsync(enrollment.CourseId);
            
            foreach (var material in courseMaterials.OrderBy(m => m.Topic).ThenByDescending(m => m.CreatedAt))
            {
                var uploader = await _unitOfWork.Users.GetByIdAsync(material.UploadedByUserId);
                var progress = await _unitOfWork.MaterialProgress.GetAsync(
                    mp => mp.MaterialId == material.Id && mp.StudentId == userId);
                
                studentMaterialDtos.Add(new MaterialResponseDto
                {
                    Id = material.Id,
                    Title = material.Title,
                    Description = material.Description,
                    Type = material.Type,
                    FileUrl = material.FileUrl,
                    Topic = material.Topic,
                    CourseId = material.CourseId,
                    CourseName = course?.Title ?? "",
                    UploadedBy = $"{uploader?.FirstName} {uploader?.LastName}",
                    UploadedAt = material.CreatedAt,
                    IsRead = progress?.IsRead
                });
            }
        }
        
        return studentMaterialDtos;
    }
}



