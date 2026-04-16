using System.ComponentModel.DataAnnotations;

namespace ContactManagement.API.Models;

public class EmailTemplate
{
    public Guid Id { get; set; }

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
    public string SequencePosition { get; set; } = "first";

    public string Industries { get; set; } = "[]";

    public string Regions { get; set; } = "[]";

    [MaxLength(50)]
    public string Status { get; set; } = "draft";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}