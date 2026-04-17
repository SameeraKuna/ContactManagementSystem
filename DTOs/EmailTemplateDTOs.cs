using System.ComponentModel.DataAnnotations;

namespace ContactManagement.API.DTOs;

// DTO for creating a new email template
public class CreateEmailTemplateDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string SubjectLine { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? PreviewText { get; set; }

    [Required]
    public string Body { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? SequencePosition { get; set; }

    public string[]? Industries { get; set; }

    public string[]? Regions { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }
}

// DTO for updating an existing email template
public class UpdateEmailTemplateDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string SubjectLine { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? PreviewText { get; set; }

    [Required]
    public string Body { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? SequencePosition { get; set; }

    public string[]? Industries { get; set; }

    public string[]? Regions { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }
}

// DTO for email template response
public class EmailTemplateResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SubjectLine { get; set; } = string.Empty;
    public string? PreviewText { get; set; }
    public string Body { get; set; } = string.Empty;
    public string SequencePosition { get; set; } = "first";

    public string[] Industries { get; set; } = Array.Empty<string>();
    public string[] Regions { get; set; } = Array.Empty<string>();

    public string Status { get; set; } = "draft";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}