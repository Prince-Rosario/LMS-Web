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
        
        if (teacher == null || teacher.Role != UserRole.Teacher)
        {
            throw new UnauthorizedException("Only teachers can create courses");
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
            CreatedAt = course.CreatedAt
        };
    }
    
    public async Task<CourseResponseDto> JoinCourseAsync(int studentId, JoinCourseDto joinCourseDto)
    {
        var student = await _unitOfWork.Users.GetByIdAsync(studentId);
        
        if (student == null || student.Role != UserRole.Student)
        {
            throw new UnauthorizedException("Only students can join courses");
        }
        
        var course = await _unitOfWork.Courses.GetAsync(c => c.InvitationCode == joinCourseDto.InvitationCode);
        
        if (course == null)
        {
            throw new NotFoundException("Course not found with this invitation code");
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
        
        if (student == null || student.Role != UserRole.Student)
        {
            throw new UnauthorizedException("Only students can view enrolled courses");
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
                    CreatedAt = course.CreatedAt
                });
            }
        }
        
        return courses;
    }
}




