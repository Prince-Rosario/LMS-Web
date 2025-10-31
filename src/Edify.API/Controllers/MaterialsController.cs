using System.Security.Claims;
using Edify.Core.DTOs.Materials;
using Edify.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Edify.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;
    
    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }
    
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
    
    [HttpPost]
    public async Task<ActionResult<MaterialResponseDto>> UploadMaterial([FromBody] UploadMaterialDto uploadDto)
    {
        var userId = GetUserId();
        var response = await _materialService.UploadMaterialAsync(userId, uploadDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Upload a file as Base64 (images, PDFs, documents up to 5MB)
    /// </summary>
    /// <param name="uploadDto">File data including Base64 encoded content</param>
    /// <returns>Uploaded material details</returns>
    /// <response code="200">File uploaded successfully</response>
    /// <response code="400">File size exceeds limit or invalid file type</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (not a teacher)</response>
    [HttpPost("upload-file")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(MaterialResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MaterialResponseDto>> UploadFile([FromBody] UploadFileDto uploadDto)
    {
        var userId = GetUserId();
        var response = await _materialService.UploadFileAsync(userId, uploadDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Add a video link (YouTube, Vimeo, etc.)
    /// </summary>
    /// <param name="videoDto">Video link details</param>
    /// <returns>Created video material details</returns>
    /// <response code="200">Video link added successfully</response>
    /// <response code="400">Invalid URL or validation error</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (not a teacher)</response>
    [HttpPost("add-video-link")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(MaterialResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MaterialResponseDto>> AddVideoLink([FromBody] AddVideoLinkDto videoDto)
    {
        var userId = GetUserId();
        var response = await _materialService.AddVideoLinkAsync(userId, videoDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Create a post/announcement with optional attachments
    /// </summary>
    /// <param name="postDto">Post details including optional file or link attachment</param>
    /// <returns>Created post details</returns>
    /// <response code="200">Post created successfully</response>
    /// <response code="400">Validation error or file size exceeds limit</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (not a teacher)</response>
    [HttpPost("create-post")]
    [Authorize(Roles = "Teacher")]
    [ProducesResponseType(typeof(MaterialResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MaterialResponseDto>> CreatePost([FromBody] CreatePostDto postDto)
    {
        var userId = GetUserId();
        var response = await _materialService.CreatePostAsync(userId, postDto);
        return Ok(response);
    }
    
    /// <summary>
    /// Download a file stored in the database
    /// </summary>
    /// <param name="id">Material ID</param>
    /// <returns>File content with appropriate content type</returns>
    /// <response code="200">File downloaded successfully</response>
    /// <response code="400">Material does not have downloadable file data</response>
    /// <response code="401">Not authenticated</response>
    /// <response code="403">Not authorized (no access to course)</response>
    /// <response code="404">Material not found</response>
    [HttpGet("{id}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DownloadFile(int id)
    {
        var userId = GetUserId();
        
        // First get material details to get filename and content type
        var material = await _materialService.GetMaterialByIdAsync(id, userId);
        
        // Download file bytes
        var fileBytes = await _materialService.DownloadFileAsync(id, userId);
        
        return File(fileBytes, material.ContentType ?? "application/octet-stream", material.FileName);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<MaterialResponseDto>> GetMaterialById(int id)
    {
        var userId = GetUserId();
        var response = await _materialService.GetMaterialByIdAsync(id, userId);
        return Ok(response);
    }
    
    [HttpGet("course/{courseId}")]
    public async Task<ActionResult<IEnumerable<MaterialResponseDto>>> GetCourseMaterials(int courseId, [FromQuery] string? topic = null)
    {
        var userId = GetUserId();
        var materials = await _materialService.GetCourseMaterialsAsync(courseId, userId, topic);
        return Ok(materials);
    }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<MaterialResponseDto>> UpdateMaterial(int id, [FromBody] UpdateMaterialDto updateDto)
    {
        var userId = GetUserId();
        var response = await _materialService.UpdateMaterialAsync(id, userId, updateDto);
        return Ok(response);
    }
    
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMaterial(int id)
    {
        var userId = GetUserId();
        await _materialService.DeleteMaterialAsync(id, userId);
        return Ok(new { message = "Material deleted successfully" });
    }
    
    [HttpPost("mark-as-read")]
    public async Task<ActionResult> MarkAsRead([FromBody] MarkAsReadDto markAsReadDto)
    {
        var userId = GetUserId();
        await _materialService.MarkAsReadAsync(userId, markAsReadDto);
        return Ok(new { message = "Material marked as read" });
    }
    
    [HttpGet("my-materials")]
    public async Task<ActionResult<IEnumerable<MaterialResponseDto>>> GetMyMaterials([FromQuery] int? courseId = null)
    {
        var userId = GetUserId();
        var materials = await _materialService.GetMyMaterialsAsync(userId, courseId);
        return Ok(materials);
    }
}




