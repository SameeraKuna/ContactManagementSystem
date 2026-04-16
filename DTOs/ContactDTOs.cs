using System.ComponentModel.DataAnnotations;

namespace ContactManagement.API.DTOs;

// DTO for creating a new contact
public class CreateContactDto
{
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
}

// DTO for updating an existing contact
public class UpdateContactDto
{
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
    public string? Status { get; set; }
}

// DTO for contact response
public class ContactResponseDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? EmployeeCount { get; set; }
    public string? Industry { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Phone { get; set; }
    public string? LeadSource { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "New";
    public DateTime? UnsubscribedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}