namespace Edify.Core.Enums;

public enum TestStatus
{
    Draft = 0,       // Test is being created, not visible to students
    Published = 1,   // Test is live and available to students
    Closed = 2,      // Test is closed, no more submissions
    Archived = 3     // Test is archived
}


