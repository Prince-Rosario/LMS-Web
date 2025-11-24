using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Edify.Core.Validation;

/// <summary>
/// Validates that a URL is from a supported video platform.
/// Supported platforms: YouTube, Vimeo, Dailymotion, Twitch, Wistia, Loom, Vidyard
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public class VideoUrlAttribute : ValidationAttribute
{
    private static readonly string[] SupportedPlatformPatterns = new[]
    {
        // YouTube (youtube.com, youtu.be, youtube-nocookie.com)
        @"^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)[\w\-]+",
        
        // Vimeo (vimeo.com, player.vimeo.com)
        @"^https?:\/\/(www\.)?(vimeo\.com\/|player\.vimeo\.com\/video\/)\d+",
        
        // Dailymotion (dailymotion.com, dai.ly)
        @"^https?:\/\/(www\.)?(dailymotion\.com\/(video|embed\/video)\/|dai\.ly\/)[\w]+",
        
        // Twitch (twitch.tv, clips.twitch.tv)
        @"^https?:\/\/(www\.)?(twitch\.tv\/|clips\.twitch\.tv\/|player\.twitch\.tv\/)[\w\-\/]+",
        
        // Wistia (wistia.com, fast.wistia.net)
        @"^https?:\/\/([\w]+\.)?(wistia\.com|wistia\.net|wi\.st)\/(medias|embed)\/[\w]+",
        
        // Loom (loom.com)
        @"^https?:\/\/(www\.)?loom\.com\/(share|embed)\/[\w\-]+",
        
        // Vidyard (vidyard.com, share.vidyard.com)
        @"^https?:\/\/([\w]+\.)?vidyard\.com\/(watch|share|embed)\/[\w\-]+",
        
        // Google Drive (drive.google.com - video files)
        @"^https?:\/\/drive\.google\.com\/(file\/d\/|open\?id=)[\w\-]+",
        
        // Microsoft Stream (web.microsoftstream.com)
        @"^https?:\/\/(web\.)?microsoftstream\.com\/(video|embed)\/[\w\-]+",
        
        // Kaltura (various subdomains)
        @"^https?:\/\/[\w]+\.kaltura\.com\/(p\/\d+\/sp\/\d+\/)?embedIframeJs\/[\w\/]+",
        
        // Panopto
        @"^https?:\/\/[\w]+\.panopto\.com\/Panopto\/(Pages\/Viewer|Embed)\.aspx\?[\w\=\&\-]+",
        
        // Zoom recordings
        @"^https?:\/\/([\w]+\.)?zoom\.us\/rec\/(share|play)\/[\w\-\?]+",
    };

    private static readonly Regex[] CompiledPatterns = SupportedPlatformPatterns
        .Select(p => new Regex(p, RegexOptions.IgnoreCase | RegexOptions.Compiled))
        .ToArray();

    public static readonly string[] SupportedPlatforms = new[]
    {
        "YouTube", "Vimeo", "Dailymotion", "Twitch", "Wistia", 
        "Loom", "Vidyard", "Google Drive", "Microsoft Stream", 
        "Kaltura", "Panopto", "Zoom"
    };

    public VideoUrlAttribute()
    {
        ErrorMessage = $"Invalid video URL. Only links from supported platforms are allowed: {string.Join(", ", SupportedPlatforms)}";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        {
            return ValidationResult.Success; // Let [Required] handle null/empty validation
        }

        var url = value.ToString()!;

        // First check if it's a valid URL format
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || 
            (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            return new ValidationResult("Please provide a valid HTTP or HTTPS URL.");
        }

        // Check against all supported platform patterns
        foreach (var pattern in CompiledPatterns)
        {
            if (pattern.IsMatch(url))
            {
                return ValidationResult.Success;
            }
        }

        return new ValidationResult(ErrorMessage);
    }

    /// <summary>
    /// Static method to validate a video URL without using the attribute
    /// </summary>
    public static bool IsValidVideoUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || 
            (uri.Scheme != "http" && uri.Scheme != "https"))
            return false;

        return CompiledPatterns.Any(pattern => pattern.IsMatch(url));
    }

    /// <summary>
    /// Gets the platform name from a video URL
    /// </summary>
    public static string? GetPlatformName(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;

        var lowerUrl = url.ToLowerInvariant();

        if (lowerUrl.Contains("youtube") || lowerUrl.Contains("youtu.be"))
            return "YouTube";
        if (lowerUrl.Contains("vimeo"))
            return "Vimeo";
        if (lowerUrl.Contains("dailymotion") || lowerUrl.Contains("dai.ly"))
            return "Dailymotion";
        if (lowerUrl.Contains("twitch"))
            return "Twitch";
        if (lowerUrl.Contains("wistia") || lowerUrl.Contains("wi.st"))
            return "Wistia";
        if (lowerUrl.Contains("loom.com"))
            return "Loom";
        if (lowerUrl.Contains("vidyard"))
            return "Vidyard";
        if (lowerUrl.Contains("drive.google.com"))
            return "Google Drive";
        if (lowerUrl.Contains("microsoftstream"))
            return "Microsoft Stream";
        if (lowerUrl.Contains("kaltura"))
            return "Kaltura";
        if (lowerUrl.Contains("panopto"))
            return "Panopto";
        if (lowerUrl.Contains("zoom.us"))
            return "Zoom";

        return null;
    }
}

