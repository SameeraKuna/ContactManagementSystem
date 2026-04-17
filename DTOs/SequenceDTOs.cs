using System.ComponentModel.DataAnnotations;

namespace ContactManagement.API.DTOs;

// Request DTOs
public class CreateSequenceRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid Template1Id { get; set; }

    public Guid? Template2Id { get; set; }

    [Range(1, 30)]
    public int DelayDays { get; set; } = 3;

    [Required]
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Send time must be in HH:mm format")]
    public string SendTime { get; set; } = "09:00";

    public bool SendWeekdaysOnly { get; set; } = true;
}

public class UpdateSequenceRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid Template1Id { get; set; }

    public Guid? Template2Id { get; set; }

    [Range(1, 30)]
    public int DelayDays { get; set; } = 3;

    [Required]
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "Send time must be in HH:mm format")]
    public string SendTime { get; set; } = "09:00";

    public bool SendWeekdaysOnly { get; set; } = true;
}

public class EnrolContactsRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one contact ID is required")]
    public List<Guid> ContactIds { get; set; } = new();
}

// Response DTOs
public class SequenceResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid Template1Id { get; set; }
    public Guid? Template2Id { get; set; }
    public int DelayDays { get; set; }
    public string SendTime { get; set; } = string.Empty;
    public bool SendWeekdaysOnly { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public TemplateInfo? Template1 { get; set; }
    public TemplateInfo? Template2 { get; set; }
    public int EnrolmentCount { get; set; }
}

public class SequenceListResponse
{
    public List<SequenceResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class TemplateInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SubjectLine { get; set; } = string.Empty;
    public string SequencePosition { get; set; } = string.Empty;
}

public class EnrolmentResponse
{
    public Guid Id { get; set; }
    public Guid ContactId { get; set; }
    public Guid SequenceId { get; set; }
    public int CurrentStep { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? NextSendAt { get; set; }
    public DateTime EnrolledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public ContactInfo? Contact { get; set; }
}

public class ContactInfo
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class EnrolmentResult
{
    public int TotalRequested { get; set; }
    public int SuccessfullyEnrolled { get; set; }
    public int AlreadyEnrolled { get; set; }
    public int SkippedDueToStatus { get; set; }
    public List<EnrolmentResponse> Enrolments { get; set; } = new();
}

public class SequenceStatsResponse
{
    public int TotalEnrolments { get; set; }
    public int PendingCount { get; set; }
    public int SentCount { get; set; }
    public int CompletedCount { get; set; }
    public int BouncedCount { get; set; }
    public int UnsubscribedCount { get; set; }
}