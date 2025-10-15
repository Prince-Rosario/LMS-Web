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
}




