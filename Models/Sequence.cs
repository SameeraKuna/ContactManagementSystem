using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ContactManagement.API.Models;

public class Sequence
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid Template1Id { get; set; }

    public Guid? Template2Id { get; set; }

    [Range(1, 30)]
    public int DelayDays { get; set; } = 3;

    [Required]
    public TimeSpan SendTime { get; set; } = new TimeSpan(9, 0, 0); // Default 09:00

    public bool SendWeekdaysOnly { get; set; } = true;

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "draft"; // "draft", "active", "paused", "archived"

    public Guid? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(Template1Id))]
    public EmailTemplate? Template1 { get; set; }

    [ForeignKey(nameof(Template2Id))]
    public EmailTemplate? Template2 { get; set; }

    public ICollection<SequenceEnrolment> Enrolments { get; set; } = new List<SequenceEnrolment>();
}