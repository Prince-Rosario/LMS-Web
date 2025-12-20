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

    public async Task<CourseResponseDto> GetCourseByIdAsync(int courseId, int userId)
    {
        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        if (course == null || !course.IsActive)
        {
            throw new NotFoundException("Course not found");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("User not found");
        }

        // Check if user has access to this course
        bool hasAccess = false;
        
        // Admin can see all courses
        if (user.Role == UserRole.Admin)
        {
            hasAccess = true;
        }
        // Teacher of the course
        else if (course.TeacherId == userId)
        {
            hasAccess = true;
        }
        // Enrolled student
        else
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == courseId && e.Status == EnrollmentStatus.Approved);
            hasAccess = enrollment != null;
        }

        if (!hasAccess)
        {
            throw new NotFoundException("Course not found or you don't have access");
        }

        var teacher = await _unitOfWork.Users.GetByIdAsync(course.TeacherId);

        return new CourseResponseDto
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
        };
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

    public async Task<StudentProgressSummaryDto> GetStudentProgressAsync(int studentId)
    {
        var student = await _unitOfWork.Users.GetByIdAsync(studentId);
        if (student == null || !student.CanStudy)
        {
            throw new UnauthorizedException("Only students can view progress");
        }

        // Get all approved enrollments
        var enrollments = await _unitOfWork.Enrollments.FindAsync(
            e => e.StudentId == studentId && e.Status == EnrollmentStatus.Approved);
        var enrollmentsList = enrollments.ToList();

        var courseProgressList = new List<CourseProgressItemDto>();
        int totalMaterials = 0;
        int completedMaterials = 0;
        int totalTests = 0;
        int completedTests = 0;
        decimal totalTestScore = 0;
        int gradedTestsCount = 0;

        foreach (var enrollment in enrollmentsList)
        {
            var course = await _unitOfWork.Courses.GetByIdAsync(enrollment.CourseId);
            if (course == null || !course.IsActive) continue;

            // Get materials for this course
            var courseMaterials = await _unitOfWork.Materials.FindAsync(
                m => m.CourseId == course.Id && m.IsActive);
            var materialsList = courseMaterials.ToList();
            int courseTotalMaterials = materialsList.Count;
            
            // Get materials read by student
            var materialsRead = await _unitOfWork.MaterialProgress.FindAsync(
                mp => mp.StudentId == studentId && mp.IsRead && 
                      materialsList.Select(m => m.Id).Contains(mp.MaterialId));
            int courseMaterialsRead = materialsRead.Count();

            // Get tests for this course
            var courseTests = await _unitOfWork.Tests.FindAsync(
                t => t.CourseId == course.Id && t.IsActive && t.Status == TestStatus.Published);
            var testsList = courseTests.ToList();
            int courseTotalTests = testsList.Count;

            // Get test attempts for student
            var testAttempts = await _unitOfWork.TestAttempts.FindAsync(
                ta => ta.StudentId == studentId && 
                      testsList.Select(t => t.Id).Contains(ta.TestId) &&
                      (ta.Status == TestAttemptStatus.Submitted || ta.Status == TestAttemptStatus.Graded));
            var attemptsList = testAttempts.ToList();
            
            // Get unique tests completed (best attempt per test)
            var uniqueTestsCompleted = attemptsList
                .GroupBy(ta => ta.TestId)
                .Select(g => g.OrderByDescending(ta => ta.Percentage ?? 0).First())
                .ToList();
            int courseTestsCompleted = uniqueTestsCompleted.Count;

            // Calculate average score for this course
            var gradedAttempts = uniqueTestsCompleted.Where(ta => ta.Percentage.HasValue).ToList();
            decimal courseAvgScore = gradedAttempts.Any() 
                ? gradedAttempts.Average(ta => ta.Percentage!.Value) 
                : 0;

            courseProgressList.Add(new CourseProgressItemDto
            {
                CourseId = course.Id,
                CourseTitle = course.Title,
                MaterialsRead = courseMaterialsRead,
                TotalMaterials = courseTotalMaterials,
                MaterialsPercentage = courseTotalMaterials > 0 
                    ? Math.Round((decimal)courseMaterialsRead / courseTotalMaterials * 100, 2) 
                    : 0,
                TestsCompleted = courseTestsCompleted,
                TotalTests = courseTotalTests,
                TestsPercentage = courseTotalTests > 0 
                    ? Math.Round((decimal)courseTestsCompleted / courseTotalTests * 100, 2) 
                    : 0,
                AverageScore = courseAvgScore,
                EnrolledAt = enrollment.CreatedAt
            });

            // Aggregate totals
            totalMaterials += courseTotalMaterials;
            completedMaterials += courseMaterialsRead;
            totalTests += courseTotalTests;
            completedTests += courseTestsCompleted;
            
            if (gradedAttempts.Any())
            {
                totalTestScore += gradedAttempts.Sum(ta => ta.Percentage!.Value);
                gradedTestsCount += gradedAttempts.Count;
            }
        }

        return new StudentProgressSummaryDto
        {
            TotalCoursesEnrolled = enrollmentsList.Count,
            CompletedMaterials = completedMaterials,
            TotalMaterials = totalMaterials,
            MaterialsCompletionPercentage = totalMaterials > 0 
                ? Math.Round((decimal)completedMaterials / totalMaterials * 100, 2) 
                : 0,
            CompletedTests = completedTests,
            TotalTests = totalTests,
            TestsCompletionPercentage = totalTests > 0 
                ? Math.Round((decimal)completedTests / totalTests * 100, 2) 
                : 0,
            AverageTestScore = gradedTestsCount > 0 
                ? Math.Round(totalTestScore / gradedTestsCount, 2) 
                : 0,
            CourseProgress = courseProgressList.OrderByDescending(cp => cp.EnrolledAt).ToList()
        };
    }

    public async Task<CourseStudentProgressDto> GetCourseStudentProgressAsync(int teacherId, int courseId)
    {
        var teacher = await _unitOfWork.Users.GetByIdAsync(teacherId);
        if (teacher == null || !teacher.CanTeach)
        {
            throw new UnauthorizedException("Only teachers can view course progress");
        }

        var course = await _unitOfWork.Courses.GetByIdAsync(courseId);
        if (course == null || !course.IsActive)
        {
            throw new NotFoundException("Course not found");
        }

        if (course.TeacherId != teacherId)
        {
            throw new UnauthorizedException("You can only view progress for your own courses");
        }

        // Get all approved enrollments for this course
        var enrollments = await _unitOfWork.Enrollments.FindAsync(
            e => e.CourseId == courseId && e.Status == EnrollmentStatus.Approved);
        var enrollmentsList = enrollments.ToList();

        // Get all materials and tests for this course
        var courseMaterials = await _unitOfWork.Materials.FindAsync(
            m => m.CourseId == courseId && m.IsActive);
        var materialsList = courseMaterials.ToList();
        int totalMaterials = materialsList.Count;

        var courseTests = await _unitOfWork.Tests.FindAsync(
            t => t.CourseId == courseId && t.IsActive && t.Status == TestStatus.Published);
        var testsList = courseTests.ToList();
        int totalTests = testsList.Count;

        var studentProgressList = new List<StudentProgressDetailDto>();

        foreach (var enrollment in enrollmentsList)
        {
            var student = await _unitOfWork.Users.GetByIdAsync(enrollment.StudentId);
            if (student == null) continue;

            // Get materials read by this student
            var materialsRead = await _unitOfWork.MaterialProgress.FindAsync(
                mp => mp.StudentId == student.Id && mp.IsRead && 
                      materialsList.Select(m => m.Id).Contains(mp.MaterialId));
            int materialsReadCount = materialsRead.Count();
            decimal materialsPercentage = totalMaterials > 0 
                ? Math.Round((decimal)materialsReadCount / totalMaterials * 100, 2) 
                : 0;

            // Get test attempts for this student
            var testAttempts = await _unitOfWork.TestAttempts.FindAsync(
                ta => ta.StudentId == student.Id && 
                      testsList.Select(t => t.Id).Contains(ta.TestId) &&
                      (ta.Status == TestAttemptStatus.Submitted || ta.Status == TestAttemptStatus.Graded));
            var attemptsList = testAttempts.ToList();

            // Get unique tests completed (best attempt per test)
            var uniqueTestsCompleted = attemptsList
                .GroupBy(ta => ta.TestId)
                .Select(g => g.OrderByDescending(ta => ta.Percentage ?? 0).First())
                .ToList();
            int testsCompletedCount = uniqueTestsCompleted.Count;
            decimal testsPercentage = totalTests > 0 
                ? Math.Round((decimal)testsCompletedCount / totalTests * 100, 2) 
                : 0;

            // Calculate average test score
            var gradedAttempts = uniqueTestsCompleted.Where(ta => ta.Percentage.HasValue).ToList();
            decimal avgScore = gradedAttempts.Any() 
                ? Math.Round(gradedAttempts.Average(ta => ta.Percentage!.Value), 2) 
                : 0;

            // Determine status: struggling if avg score < 60 or completion < 50%
            string status = "on-track";
            if ((avgScore > 0 && avgScore < 60) || 
                (materialsPercentage < 50 && totalMaterials > 0) || 
                (testsPercentage < 50 && totalTests > 0))
            {
                status = "struggling";
            }

            studentProgressList.Add(new StudentProgressDetailDto
            {
                StudentId = student.Id,
                StudentName = $"{student.FirstName} {student.LastName}",
                GroupClass = student.GroupClass,
                MaterialsReadCount = materialsReadCount,
                TotalMaterials = totalMaterials,
                MaterialsReadPercentage = materialsPercentage,
                TestsCompletedCount = testsCompletedCount,
                TotalTests = totalTests,
                TestsCompletedPercentage = testsPercentage,
                AverageTestScore = avgScore,
                Status = status,
                EnrolledAt = enrollment.CreatedAt
            });
        }

        return new CourseStudentProgressDto
        {
            CourseId = course.Id,
            CourseTitle = course.Title,
            TotalStudents = enrollmentsList.Count,
            StudentProgress = studentProgressList.OrderBy(sp => sp.Status == "struggling" ? 0 : 1)
                                                  .ThenBy(sp => sp.AverageTestScore)
                                                  .ToList()
        };
    }
}




