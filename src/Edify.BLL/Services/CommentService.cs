using Edify.BLL.Exceptions;
using Edify.Core.DTOs.Comments;
using Edify.Core.Entities;
using Edify.Core.Enums;
using Edify.Core.Interfaces;

namespace Edify.BLL.Services;

public class CommentService : ICommentService
{
    private readonly IUnitOfWork _unitOfWork;

    public CommentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CommentResponseDto> CreateCommentAsync(int userId, CreateCommentDto createDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("User not found");

        // Verify access to the commentable item
        await VerifyCommentableAccess(createDto.CommentableType, createDto.CommentableId, userId);

        // Verify parent comment if provided
        if (createDto.ParentCommentId.HasValue)
        {
            var parentComment = await _unitOfWork.Comments.GetByIdAsync(createDto.ParentCommentId.Value);
            if (parentComment == null || parentComment.IsDeleted)
                throw new BadRequestException("Parent comment not found");

            if (parentComment.CommentableType != createDto.CommentableType ||
                parentComment.CommentableId != createDto.CommentableId)
                throw new BadRequestException("Parent comment must belong to the same item");
        }

        var comment = new Comment
        {
            Content = createDto.Content,
            CommentableType = createDto.CommentableType,
            CommentableId = createDto.CommentableId,
            AuthorId = userId,
            ParentCommentId = createDto.ParentCommentId
        };

        await _unitOfWork.Comments.AddAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        return await BuildCommentResponse(comment, userId);
    }

    public async Task<CommentResponseDto> UpdateCommentAsync(int userId, int commentId, UpdateCommentDto updateDto)
    {
        var comment = await _unitOfWork.Comments.GetByIdAsync(commentId);
        if (comment == null || comment.IsDeleted)
            throw new NotFoundException("Comment not found");

        if (comment.AuthorId != userId)
            throw new UnauthorizedException("You can only edit your own comments");

        // Only allow editing within 30 minutes
        if ((DateTime.UtcNow - comment.CreatedAt).TotalMinutes > 30)
            throw new BadRequestException("Comments can only be edited within 30 minutes");

        comment.Content = updateDto.Content;
        comment.IsEdited = true;

        await _unitOfWork.Comments.UpdateAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        return await BuildCommentResponse(comment, userId);
    }

    public async Task DeleteCommentAsync(int userId, int commentId)
    {
        var comment = await _unitOfWork.Comments.GetByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("Comment not found");

        // Allow deletion by author or course teacher
        bool canDelete = comment.AuthorId == userId;

        if (!canDelete)
        {
            // Check if user is teacher of the related course
            int? courseId = await GetCourseIdForCommentable(comment.CommentableType, comment.CommentableId);
            if (courseId.HasValue)
            {
                var course = await _unitOfWork.Courses.GetByIdAsync(courseId.Value);
                canDelete = course?.TeacherId == userId;
            }
        }

        if (!canDelete)
            throw new UnauthorizedException("You can only delete your own comments");

        comment.IsDeleted = true;
        comment.Content = "[Comment deleted]";

        await _unitOfWork.Comments.UpdateAsync(comment);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<CommentResponseDto> GetCommentByIdAsync(int commentId, int userId)
    {
        var comment = await _unitOfWork.Comments.GetByIdAsync(commentId);
        if (comment == null || comment.IsDeleted)
            throw new NotFoundException("Comment not found");

        await VerifyCommentableAccess(comment.CommentableType, comment.CommentableId, userId);

        return await BuildCommentResponse(comment, userId, includeReplies: true);
    }

    public async Task<CommentsPageDto> GetCommentsAsync(int userId, GetCommentsDto getDto)
    {
        await VerifyCommentableAccess(getDto.CommentableType, getDto.CommentableId, userId);

        var allComments = await _unitOfWork.Comments.FindAsync(
            c => c.CommentableType == getDto.CommentableType &&
                 c.CommentableId == getDto.CommentableId &&
                 c.ParentCommentId == null); // Only top-level comments

        var totalCount = allComments.Count();

        var comments = allComments
            .OrderByDescending(c => c.CreatedAt)
            .Skip((getDto.Page - 1) * getDto.PageSize)
            .Take(getDto.PageSize)
            .ToList();

        var commentDtos = new List<CommentResponseDto>();
        foreach (var comment in comments)
        {
            commentDtos.Add(await BuildCommentResponse(comment, userId, getDto.IncludeReplies));
        }

        return new CommentsPageDto
        {
            Comments = commentDtos,
            TotalCount = totalCount,
            Page = getDto.Page,
            PageSize = getDto.PageSize,
            HasMore = totalCount > getDto.Page * getDto.PageSize
        };
    }

    public async Task<int> GetCommentCountAsync(int commentableType, int commentableId)
    {
        var comments = await _unitOfWork.Comments.FindAsync(
            c => c.CommentableType == (CommentableType)commentableType &&
                 c.CommentableId == commentableId &&
                 !c.IsDeleted);

        return comments.Count();
    }

    private async Task VerifyCommentableAccess(CommentableType type, int id, int userId)
    {
        int? courseId = await GetCourseIdForCommentable(type, id);

        if (!courseId.HasValue)
            throw new NotFoundException("Item not found");

        var course = await _unitOfWork.Courses.GetByIdAsync(courseId.Value);
        if (course == null)
            throw new NotFoundException("Course not found");

        bool isTeacher = course.TeacherId == userId;
        if (!isTeacher)
        {
            var enrollment = await _unitOfWork.Enrollments.GetAsync(
                e => e.StudentId == userId && e.CourseId == courseId.Value && e.Status == EnrollmentStatus.Approved);
            if (enrollment == null)
                throw new UnauthorizedException("You don't have access to this item");
        }
    }

    private async Task<int?> GetCourseIdForCommentable(CommentableType type, int id)
    {
        switch (type)
        {
            case CommentableType.Material:
                var material = await _unitOfWork.Materials.GetByIdAsync(id);
                return material?.CourseId;

            case CommentableType.Test:
                var test = await _unitOfWork.Tests.GetByIdAsync(id);
                return test?.CourseId;

            case CommentableType.TestAttempt:
                var attempt = await _unitOfWork.TestAttempts.GetByIdAsync(id);
                if (attempt == null) return null;
                var attemptTest = await _unitOfWork.Tests.GetByIdAsync(attempt.TestId);
                return attemptTest?.CourseId;

            default:
                return null;
        }
    }

    private async Task<CommentResponseDto> BuildCommentResponse(Comment comment, int userId, bool includeReplies = false)
    {
        var author = await _unitOfWork.Users.GetByIdAsync(comment.AuthorId);
        
        int? courseId = await GetCourseIdForCommentable(comment.CommentableType, comment.CommentableId);
        var course = courseId.HasValue ? await _unitOfWork.Courses.GetByIdAsync(courseId.Value) : null;

        var replies = new List<CommentResponseDto>();
        int replyCount = 0;

        if (includeReplies)
        {
            var replyComments = await _unitOfWork.Comments.FindAsync(
                c => c.ParentCommentId == comment.Id && !c.IsDeleted);
            replyCount = replyComments.Count();

            foreach (var reply in replyComments.OrderBy(c => c.CreatedAt))
            {
                replies.Add(await BuildCommentResponse(reply, userId, false)); // Don't nest replies further
            }
        }
        else
        {
            var replyComments = await _unitOfWork.Comments.FindAsync(
                c => c.ParentCommentId == comment.Id && !c.IsDeleted);
            replyCount = replyComments.Count();
        }

        return new CommentResponseDto
        {
            Id = comment.Id,
            Content = comment.Content,
            CommentableType = comment.CommentableType,
            CommentableId = comment.CommentableId,
            AuthorId = comment.AuthorId,
            AuthorName = $"{author?.FirstName} {author?.LastName}",
            AuthorInitials = $"{author?.FirstName?[0]}{author?.LastName?[0]}",
            IsTeacher = course?.TeacherId == comment.AuthorId,
            ParentCommentId = comment.ParentCommentId,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            IsEdited = comment.IsEdited,
            IsDeleted = comment.IsDeleted,
            IsOwnComment = comment.AuthorId == userId,
            ReplyCount = replyCount,
            Replies = replies
        };
    }
}






