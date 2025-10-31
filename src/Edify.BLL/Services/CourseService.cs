using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Courses;
using Edify.Core.Entities;
using Edify.Core.Enums;
using Edify.Core.Helpers;
using Edify.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Edify.BLL.Services;

public class CourseService : ICourseService
{
    private readonly IUnitOfWork _unitOfWork;
    
    public CourseService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }
    
    public async Task<CourseResponseDto> CreateCourseAsync(int teacherId, CreateCourseDto createCourseDto)
    {
        var teacher = await _unitOfWork.Users.GetByIdAsync(teacherId);
        
        if (teacher == null)
        {
            throw new NotFoundException("User not found");
        }
        
        if (!teacher.CanTeach)
        {
            throw new UnauthorizedException("Only users with teaching capability can create courses");
        }
        
        // Generate unique invitation code
        string invitationCode;
        do
        {
            invitationCode = InvitationCodeGenerator.Generate();
        } while (await _unitOfWork.Courses.ExistsAsync(c => c.InvitationCode == invitationCode));
        
        var course = new Course
        {
            Title = createCourseDto.Title,
            Description = createCourseDto.Description,
            InvitationCode = invitationCode,
            TeacherId = teacherId
        };
        
        await _unitOfWork.Courses.AddAsync(course);
        await _unitOfWork.SaveChangesAsync();
        
        return new CourseResponseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            InvitationCode = course.InvitationCode,
            TeacherName = $"{teacher.FirstName} {teacher.LastName}",
            TeacherId = teacher.Id,
            Status = course.Status,
            RejectionReason = course.RejectionReason,
            CreatedAt = course.CreatedAt,
            ApprovedAt = course.ApprovedAt
        };
    }
    
    public async Task<CourseResponseDto> JoinCourseAsync(int studentId, JoinCourseDto joinCourseDto)
    {
        var student = await _unitOfWork.Users.GetByIdAsync(studentId);
        
        if (student == null)
        {
            throw new NotFoundException("User not found");
        }
        
        if (!student.CanStudy)
        {
            throw new UnauthorizedException("Only users with study capability can join courses");
        }
        
        var course = await _unitOfWork.Courses.GetAsync(c => c.InvitationCode == joinCourseDto.InvitationCode);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found with this invitation code");
        }
        
        if (course.Status != CourseStatus.Approved)
        {
            throw new BadRequestException("This course is not yet approved by admin");
        }
        
        // Check if already enrolled
        var existingEnrollment = await _unitOfWork.Enrollments.GetAsync(
            e => e.StudentId == studentId && e.CourseId == course.Id);
        
        if (existingEnrollment != null)
        {
            throw new BadRequestException("You are already enrolled in this course");
        }
        
        // Create enrollment request
        var enrollment = new Enrollment
        {
            StudentId = studentId,
            CourseId = course.Id,
            Status = EnrollmentStatus.Pending
        };
        
        await _unitOfWork.Enrollments.AddAsync(enrollment);
        await _unitOfWork.SaveChangesAsync();
        
        var teacher = await _unitOfWork.Users.GetByIdAsync(course.TeacherId);
        
        return new CourseResponseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            InvitationCode = course.InvitationCode,
            TeacherName = $"{teacher?.FirstName} {teacher?.LastName}",
            TeacherId = course.TeacherId,
            CreatedAt = course.CreatedAt
        };
    }
    
    public async Task<IEnumerable<EnrollmentRequestDto>> GetEnrollmentRequestsAsync(int teacherId, int courseId)
    {
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.TeacherId != teacherId)
        {
            throw new UnauthorizedException("You are not authorized to view this course's enrollment requests");
        }
        
        var enrollments = await _unitOfWork.Enrollments.FindAsync(e => e.CourseId == courseId && e.Status == EnrollmentStatus.Pending);
        
        var requests = new List<EnrollmentRequestDto>();
        foreach (var enrollment in enrollments)
        {
            var student = await _unitOfWork.Users.GetByIdAsync(enrollment.StudentId);
            if (student != null)
            {
                requests.Add(new EnrollmentRequestDto
                {
                    Id = enrollment.Id,
                    StudentId = student.Id,
                    StudentName = $"{student.FirstName} {student.LastName}",
                    StudentEmail = student.Email,
                    GroupClass = student.GroupClass,
                    CourseId = course.Id,
                    CourseTitle = course.Title,
                    Status = enrollment.Status,
                    RequestedAt = enrollment.CreatedAt
                });
            }
        }
        
        return requests;
    }
    
    public async Task ApproveEnrollmentAsync(int teacherId, ApproveEnrollmentDto approveDto)
    {
        var enrollment = await _unitOfWork.Enrollments.GetByIdAsync(approveDto.EnrollmentId);
        
        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment request not found");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(enrollment.CourseId);
        
        if (course == null || course.TeacherId != teacherId)
        {
            throw new UnauthorizedException("You are not authorized to approve this enrollment");
        }
        
        enrollment.Status = approveDto.Approve ? EnrollmentStatus.Approved : EnrollmentStatus.Rejected;
        enrollment.ApprovedAt = DateTime.UtcNow;
        
        await _unitOfWork.Enrollments.UpdateAsync(enrollment);
        await _unitOfWork.SaveChangesAsync();
    }
    
    public async Task<IEnumerable<CourseResponseDto>> GetStudentCoursesAsync(int studentId)
    {
        var student = await _unitOfWork.Users.GetByIdAsync(studentId);
        
        if (student == null || !student.CanStudy)
        {
            throw new UnauthorizedException("Only users with study capability can view enrolled courses");
        }
        
        var enrollments = await _unitOfWork.Enrollments.FindAsync(
            e => e.StudentId == studentId && e.Status == EnrollmentStatus.Approved);
        
        var courses = new List<CourseResponseDto>();
        foreach (var enrollment in enrollments)
        {
            var course = await _unitOfWork.Courses.GetByIdAsync(enrollment.CourseId);
            if (course != null && course.IsActive)
            {
                var teacher = await _unitOfWork.Users.GetByIdAsync(course.TeacherId);
                courses.Add(new CourseResponseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    InvitationCode = course.InvitationCode,
                    TeacherName = $"{teacher?.FirstName} {teacher?.LastName}",
                    TeacherId = course.TeacherId,
                    Status = course.Status,
                    RejectionReason = course.RejectionReason,
                    CreatedAt = course.CreatedAt,
                    ApprovedAt = course.ApprovedAt
                });
            }
        }
        
        return courses;
    }
    
    public async Task<IEnumerable<CourseResponseDto>> GetTeacherCoursesAsync(int teacherId)
    {
        var teacher = await _unitOfWork.Users.GetByIdAsync(teacherId);
        
        if (teacher == null || !teacher.CanTeach)
        {
            throw new UnauthorizedException("Only users with teaching capability can view their courses");
        }
        
        var courses = await _unitOfWork.Courses.FindAsync(c => c.TeacherId == teacherId && c.IsActive);
        
        var courseDtos = new List<CourseResponseDto>();
        foreach (var course in courses)
        {
            courseDtos.Add(new CourseResponseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InvitationCode = course.InvitationCode,
                TeacherName = $"{teacher.FirstName} {teacher.LastName}",
                TeacherId = teacher.Id,
                Status = course.Status,
                RejectionReason = course.RejectionReason,
                CreatedAt = course.CreatedAt,
                ApprovedAt = course.ApprovedAt
            });
        }
        
        return courseDtos;
    }
    
    public async Task<IEnumerable<CourseResponseDto>> GetAllUserCoursesAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new NotFoundException("User not found");
        }
        
        var courseDtos = new List<CourseResponseDto>();
        
        // Get courses where user is a teacher
        if (user.CanTeach)
        {
            var teachingCourses = await _unitOfWork.Courses.FindAsync(c => c.TeacherId == userId && c.IsActive);
            
            foreach (var course in teachingCourses)
            {
                courseDtos.Add(new CourseResponseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    InvitationCode = course.InvitationCode,
                    TeacherName = $"{user.FirstName} {user.LastName}",
                    TeacherId = user.Id,
                    Status = course.Status,
                    RejectionReason = course.RejectionReason,
                    CreatedAt = course.CreatedAt,
                    ApprovedAt = course.ApprovedAt
                });
            }
        }
        
        // Get courses where user is enrolled as a student
        if (user.CanStudy)
        {
            var enrollments = await _unitOfWork.Enrollments.FindAsync(
                e => e.StudentId == userId && e.Status == EnrollmentStatus.Approved);
            
            foreach (var enrollment in enrollments)
            {
                var course = await _unitOfWork.Courses.GetByIdAsync(enrollment.CourseId);
                if (course != null && course.IsActive)
                {
                    var teacher = await _unitOfWork.Users.GetByIdAsync(course.TeacherId);
                    courseDtos.Add(new CourseResponseDto
                    {
                        Id = course.Id,
                        Title = course.Title,
                        Description = course.Description,
                        InvitationCode = course.InvitationCode,
                        TeacherName = $"{teacher?.FirstName} {teacher?.LastName}",
                        TeacherId = course.TeacherId,
                        Status = course.Status,
                        RejectionReason = course.RejectionReason,
                        CreatedAt = course.CreatedAt,
                        ApprovedAt = course.ApprovedAt
                    });
                }
            }
        }
        
        return courseDtos;
    }
    
    public async Task<IEnumerable<CourseResponseDto>> GetPendingCoursesAsync(int adminId)
    {
        var admin = await _unitOfWork.Users.GetByIdAsync(adminId);
        
        if (admin == null || admin.Role != UserRole.Admin)
        {
            throw new UnauthorizedException("Only admins can view pending courses");
        }
        
        var pendingCourses = await _unitOfWork.Courses.FindAsync(c => c.Status == CourseStatus.Pending);
        
        var courseDtos = new List<CourseResponseDto>();
        foreach (var course in pendingCourses.OrderBy(c => c.CreatedAt))
        {
            var teacher = await _unitOfWork.Users.GetByIdAsync(course.TeacherId);
            
            courseDtos.Add(new CourseResponseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InvitationCode = course.InvitationCode,
                TeacherName = $"{teacher?.FirstName} {teacher?.LastName}",
                TeacherId = course.TeacherId,
                Status = course.Status,
                RejectionReason = course.RejectionReason,
                CreatedAt = course.CreatedAt,
                ApprovedAt = course.ApprovedAt
            });
        }
        
        return courseDtos;
    }
    
    public async Task ApproveCourseAsync(int adminId, ApproveCourseDto approveDto)
    {
        var admin = await _unitOfWork.Users.GetByIdAsync(adminId);
        
        if (admin == null || admin.Role != UserRole.Admin)
        {
            throw new UnauthorizedException("Only admins can approve courses");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(approveDto.CourseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.Status != CourseStatus.Pending)
        {
            throw new BadRequestException("Only pending courses can be approved or rejected");
        }
        
        if (approveDto.Approve)
        {
            course.Status = CourseStatus.Approved;
            course.ApprovedByAdminId = adminId;
            course.ApprovedAt = DateTime.UtcNow;
            course.RejectionReason = null;
        }
        else
        {
            course.Status = CourseStatus.Rejected;
            course.RejectionReason = approveDto.RejectionReason;
            course.ApprovedByAdminId = adminId;
        }
        
        await _unitOfWork.Courses.UpdateAsync(course);
        await _unitOfWork.SaveChangesAsync();
    }
    
    public async Task<IEnumerable<CourseResponseDto>> GetAllCoursesAsync(int adminId)
    {
        var admin = await _unitOfWork.Users.GetByIdAsync(adminId);
        
        if (admin == null || admin.Role != UserRole.Admin)
        {
            throw new UnauthorizedException("Only admins can view all courses");
        }
        
        var allCourses = await _unitOfWork.Courses.GetAllAsync();
        
        var courseDtos = new List<CourseResponseDto>();
        foreach (var course in allCourses.OrderByDescending(c => c.CreatedAt))
        {
            var teacher = await _unitOfWork.Users.GetByIdAsync(course.TeacherId);
            
            courseDtos.Add(new CourseResponseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InvitationCode = course.InvitationCode,
                TeacherName = $"{teacher?.FirstName} {teacher?.LastName}",
                TeacherId = course.TeacherId,
                Status = course.Status,
                RejectionReason = course.RejectionReason,
                CreatedAt = course.CreatedAt,
                ApprovedAt = course.ApprovedAt
            });
        }
        
        return courseDtos;
    }
    
    public async Task DeleteCourseAsync(int adminId, int courseId)
    {
        var admin = await _unitOfWork.Users.GetByIdAsync(adminId);
        
        if (admin == null || admin.Role != UserRole.Admin)
        {
            throw new UnauthorizedException("Only admins can delete courses");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        // Delete associated enrollments
        var enrollments = await _unitOfWork.Enrollments.FindAsync(e => e.CourseId == courseId);
        foreach (var enrollment in enrollments)
        {
            await _unitOfWork.Enrollments.DeleteAsync(enrollment);
        }
        
        // Delete associated materials and their progress
        var materials = await _unitOfWork.Materials.FindAsync(m => m.CourseId == courseId);
        foreach (var material in materials)
        {
            var materialProgress = await _unitOfWork.MaterialProgress.FindAsync(mp => mp.MaterialId == material.Id);
            foreach (var progress in materialProgress)
            {
                await _unitOfWork.MaterialProgress.DeleteAsync(progress);
            }
            await _unitOfWork.Materials.DeleteAsync(material);
        }
        
        // Finally, delete the course
        await _unitOfWork.Courses.DeleteAsync(course);
        await _unitOfWork.SaveChangesAsync();
    }
    
    public async Task<CourseResponseDto> UpdateCourseAsync(int teacherId, int courseId, UpdateCourseDto updateCourseDto)
    {
        var teacher = await _unitOfWork.Users.GetByIdAsync(teacherId);
        
        if (teacher == null)
        {
            throw new NotFoundException("User not found");
        }
        
        if (!teacher.CanTeach)
        {
            throw new UnauthorizedException("Only users with teaching capability can update courses");
        }
        
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found");
        }
        
        if (course.TeacherId != teacherId)
        {
            throw new UnauthorizedException("You can only update your own courses");
        }
        
        // Update course details
        course.Title = updateCourseDto.Title;
        course.Description = updateCourseDto.Description;
        course.UpdatedAt = DateTime.UtcNow;
        
        await _unitOfWork.Courses.UpdateAsync(course);
        await _unitOfWork.SaveChangesAsync();
        
        return new CourseResponseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            InvitationCode = course.InvitationCode,
            TeacherName = $"{teacher.FirstName} {teacher.LastName}",
            TeacherId = teacher.Id,
            Status = course.Status,
            RejectionReason = course.RejectionReason,
            CreatedAt = course.CreatedAt,
            ApprovedAt = course.ApprovedAt
        };
    }
}




