using System.ComponentModel.DataAnnotations;

namespace ContactManagement.API.Models;

public class Contact
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Website { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(50)]
    public string? EmployeeCount { get; set; }

    [MaxLength(50)]
    public string? Industry { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? JobTitle { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    public string? LeadSource { get; set; }

    public string? Notes { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "New";

    public DateTime? UnsubscribedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}