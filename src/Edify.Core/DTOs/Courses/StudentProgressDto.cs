namespace Edify.Core.DTOs.Courses;

public class StudentProgressSummaryDto
{
    public int TotalCoursesEnrolled { get; set; }
    public int CompletedMaterials { get; set; }
    public int TotalMaterials { get; set; }
    public decimal MaterialsCompletionPercentage { get; set; }
    public int CompletedTests { get; set; }
    public int TotalTests { get; set; }
    public decimal TestsCompletionPercentage { get; set; }
    public decimal AverageTestScore { get; set; }
    public List<CourseProgressItemDto> CourseProgress { get; set; } = new();
}

public class CourseProgressItemDto
{
    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int MaterialsRead { get; set; }
    public int TotalMaterials { get; set; }
    public decimal MaterialsPercentage { get; set; }
    public int TestsCompleted { get; set; }
    public int TotalTests { get; set; }
    public decimal TestsPercentage { get; set; }
    public decimal AverageScore { get; set; }
    public DateTime EnrolledAt { get; set; }
}


