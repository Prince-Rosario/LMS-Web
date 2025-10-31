namespace Edify.Core.Enums;

/// <summary>
/// Status of a course in the admin approval workflow
/// </summary>
public enum CourseStatus
{
    /// <summary>
    /// Course is awaiting admin approval (default status when created)
    /// </summary>
    Pending = 0,
    
    /// <summary>
    /// Course has been approved by an admin and is active for student enrollment
    /// </summary>
    Approved = 1,
    
    /// <summary>
    /// Course has been rejected by an admin
    /// </summary>
    Rejected = 2
}



