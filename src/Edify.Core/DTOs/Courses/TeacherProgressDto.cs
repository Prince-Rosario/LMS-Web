namespace Edify.Core.DTOs.Courses;

public class CourseStudentProgressDto
{
    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public List<StudentProgressDetailDto> StudentProgress { get; set; } = new();
}

public class StudentProgressDetailDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? GroupClass { get; set; }
    public int MaterialsReadCount { get; set; }
    public int TotalMaterials { get; set; }
    public decimal MaterialsReadPercentage { get; set; }
    public int TestsCompletedCount { get; set; }
    public int TotalTests { get; set; }
    public decimal TestsCompletedPercentage { get; set; }
    public decimal AverageTestScore { get; set; }
    public string Status { get; set; } = "on-track"; // "on-track" or "struggling"
    public DateTime EnrolledAt { get; set; }
}


