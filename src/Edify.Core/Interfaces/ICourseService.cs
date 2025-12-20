using Edify.Core.DTOs.Courses;

namespace Edify.Core.Interfaces;

public interface ICourseService
{
    Task<CourseResponseDto> CreateCourseAsync(int teacherId, CreateCourseDto createCourseDto);
    Task<CourseResponseDto> JoinCourseAsync(int studentId, JoinCourseDto joinCourseDto);
    Task<IEnumerable<EnrollmentRequestDto>> GetEnrollmentRequestsAsync(int teacherId, int courseId);
    Task ApproveEnrollmentAsync(int teacherId, ApproveEnrollmentDto approveDto);
    Task<IEnumerable<CourseResponseDto>> GetStudentCoursesAsync(int studentId);
    Task<IEnumerable<CourseResponseDto>> GetTeacherCoursesAsync(int teacherId);
    Task<IEnumerable<CourseResponseDto>> GetAllUserCoursesAsync(int userId);
    Task<CourseResponseDto> GetCourseByIdAsync(int courseId, int userId);
    
    // Progress tracking
    Task<StudentProgressSummaryDto> GetStudentProgressAsync(int studentId);
    Task<CourseStudentProgressDto> GetCourseStudentProgressAsync(int teacherId, int courseId);
    
    // Admin methods
    Task<IEnumerable<CourseResponseDto>> GetPendingCoursesAsync(int adminId);
    Task ApproveCourseAsync(int adminId, ApproveCourseDto approveDto);
    Task<IEnumerable<CourseResponseDto>> GetAllCoursesAsync(int adminId);
    Task DeleteCourseAsync(int adminId, int courseId);
    Task<CourseResponseDto> UpdateCourseAsync(int teacherId, int courseId, UpdateCourseDto updateCourseDto);
}




