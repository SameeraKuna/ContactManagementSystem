using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;

namespace ContactManagement.API.Models;

public class EmailTemplate
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string SubjectLine { get; set; } = string.Empty;

    [StringLength(500)]
    public string? PreviewText { get; set; }

    [Required]
    public string Body { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string SequencePosition { get; set; } = "first"; // "first" or "second"

    public string[] Industries { get; set; } = Array.Empty<string>(); // ["SaaS", "Fintech", etc.]

    public string[] Regions { get; set; } = Array.Empty<string>(); // ["North America", "Europe", etc.]

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "draft"; // "draft" or "published"

    public Guid? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Sequence> SequencesAsTemplate1 { get; set; } = new List<Sequence>();
    public ICollection<Sequence> SequencesAsTemplate2 { get; set; } = new List<Sequence>();
}