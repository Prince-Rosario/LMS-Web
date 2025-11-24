using Edify.Core.DTOs.Comments;

namespace Edify.Core.Interfaces;

public interface ICommentService
{
    Task<CommentResponseDto> CreateCommentAsync(int userId, CreateCommentDto createDto);
    Task<CommentResponseDto> UpdateCommentAsync(int userId, int commentId, UpdateCommentDto updateDto);
    Task DeleteCommentAsync(int userId, int commentId);
    Task<CommentResponseDto> GetCommentByIdAsync(int commentId, int userId);
    Task<CommentsPageDto> GetCommentsAsync(int userId, GetCommentsDto getDto);
    Task<int> GetCommentCountAsync(int commentableType, int commentableId);
}

