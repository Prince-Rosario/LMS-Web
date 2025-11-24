using System.Security.Claims;
using Edify.Core.DTOs.Comments;
using Edify.Core.Enums;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

/// <summary>
/// Comments controller for posts, tests, and assignments
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    /// <summary>
    /// Create a new comment
    /// </summary>
    /// <param name="createDto">Comment content and target item</param>
    /// <returns>The created comment</returns>
    [HttpPost]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CommentResponseDto>> CreateComment([FromBody] CreateCommentDto createDto)
    {
        var userId = GetUserId();
        var comment = await _commentService.CreateCommentAsync(userId, createDto);
        return Ok(comment);
    }

    /// <summary>
    /// Update a comment (within 30 minutes)
    /// </summary>
    /// <param name="commentId">Comment ID</param>
    /// <param name="updateDto">Updated comment content</param>
    /// <returns>The updated comment</returns>
    [HttpPut("{commentId}")]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommentResponseDto>> UpdateComment(int commentId, [FromBody] UpdateCommentDto updateDto)
    {
        var userId = GetUserId();
        var comment = await _commentService.UpdateCommentAsync(userId, commentId, updateDto);
        return Ok(comment);
    }

    /// <summary>
    /// Delete a comment
    /// </summary>
    /// <param name="commentId">Comment ID</param>
    [HttpDelete("{commentId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteComment(int commentId)
    {
        var userId = GetUserId();
        await _commentService.DeleteCommentAsync(userId, commentId);
        return Ok(new { message = "Comment deleted successfully" });
    }

    /// <summary>
    /// Get a specific comment by ID
    /// </summary>
    /// <param name="commentId">Comment ID</param>
    /// <returns>Comment details with replies</returns>
    [HttpGet("{commentId}")]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommentResponseDto>> GetComment(int commentId)
    {
        var userId = GetUserId();
        var comment = await _commentService.GetCommentByIdAsync(commentId, userId);
        return Ok(comment);
    }

    /// <summary>
    /// Get comments for a material/post
    /// </summary>
    /// <param name="materialId">Material ID</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="includeReplies">Include nested replies</param>
    /// <returns>Paginated list of comments</returns>
    [HttpGet("material/{materialId}")]
    [ProducesResponseType(typeof(CommentsPageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CommentsPageDto>> GetMaterialComments(
        int materialId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeReplies = true)
    {
        var userId = GetUserId();
        var comments = await _commentService.GetCommentsAsync(userId, new GetCommentsDto
        {
            CommentableType = CommentableType.Material,
            CommentableId = materialId,
            Page = page,
            PageSize = pageSize,
            IncludeReplies = includeReplies
        });
        return Ok(comments);
    }

    /// <summary>
    /// Get comments for a test
    /// </summary>
    /// <param name="testId">Test ID</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Page size</param>
    /// <param name="includeReplies">Include nested replies</param>
    /// <returns>Paginated list of comments</returns>
    [HttpGet("test/{testId}")]
    [ProducesResponseType(typeof(CommentsPageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CommentsPageDto>> GetTestComments(
        int testId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeReplies = true)
    {
        var userId = GetUserId();
        var comments = await _commentService.GetCommentsAsync(userId, new GetCommentsDto
        {
            CommentableType = CommentableType.Test,
            CommentableId = testId,
            Page = page,
            PageSize = pageSize,
            IncludeReplies = includeReplies
        });
        return Ok(comments);
    }

    /// <summary>
    /// Get comment count for an item
    /// </summary>
    /// <param name="type">Type: 0=Material, 1=Test, 2=TestAttempt</param>
    /// <param name="id">Item ID</param>
    /// <returns>Comment count</returns>
    [HttpGet("count")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetCommentCount([FromQuery] int type, [FromQuery] int id)
    {
        var count = await _commentService.GetCommentCountAsync(type, id);
        return Ok(new { count });
    }
}

