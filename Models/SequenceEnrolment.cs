using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ContactManagement.API.Models;

public class SequenceEnrolment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ContactId { get; set; }

    [Required]
    public Guid SequenceId { get; set; }

    [Range(1, 2)]
    public int CurrentStep { get; set; } = 1;

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "pending"; // "pending", "sent", "completed", "unsubscribed", "bounced"

    public DateTime? NextSendAt { get; set; }

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(ContactId))]
    public Contact? Contact { get; set; }

    [ForeignKey(nameof(SequenceId))]
    public Sequence? Sequence { get; set; }
}