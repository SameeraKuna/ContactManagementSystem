using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ContactManagement.API.Models;

public class Contact
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Website { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(100)]
    public string? Country { get; set; }

    [StringLength(50)]
    public string? EmployeeCount { get; set; } // "10-50", "51-100", "101-250", "250+"

    [StringLength(50)]
    public string? Industry { get; set; } // "SaaS", "Fintech", "Healthcare", "E-commerce", "Other"

    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string? JobTitle { get; set; }

    [StringLength(50)]
    public string? Phone { get; set; }

    [StringLength(50)]
    public string? LeadSource { get; set; } // "Inbound form", "Outbound reach", etc.

    public string? Notes { get; set; }

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "New"; // "New", "Active", "Unsubscribed", "Bounced"

    public DateTime? UnsubscribedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid? AssignedTo { get; set; }

    // Navigation properties
    public ICollection<SequenceEnrolment> SequenceEnrolments { get; set; } = new List<SequenceEnrolment>();
}