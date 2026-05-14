namespace ContactManagement.API.DTOs;

// ============== Request DTOs ==============

public class CreateScheduleRequest
{
    public string Name { get; set; } = string.Empty;
    public string SequenceType { get; set; } = "first_only"; // first_only, second_only, full_sequence
    public string Recurrence { get; set; } = "once"; // once, weekly, biweekly, monthly
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public List<string> CompanyNames { get; set; } = new();
    public List<TemplateAssignmentDto> TemplateAssignments { get; set; } = new();
    public List<CountryTimingDto> CountryTimings { get; set; } = new();
}

public class UpdateScheduleRequest
{
    public string? Name { get; set; }
    public string? SequenceType { get; set; }
    public string? Recurrence { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public List<string>? CompanyNames { get; set; }
    public List<TemplateAssignmentDto>? TemplateAssignments { get; set; }
    public List<CountryTimingDto>? CountryTimings { get; set; }
}

public class TemplateAssignmentDto
{
    public Guid TemplateId { get; set; }
    public string SequencePosition { get; set; } = "first"; // first, second
}

public class CountryTimingDto
{
    public string CountryName { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string SendTime { get; set; } = "09:00"; // HH:mm format
    public bool WeekdaysOnly { get; set; } = true;
}

// ============== Response DTOs ==============

public class ScheduleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SequenceType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Recurrence { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ScheduleCompanyResponse> Companies { get; set; } = new();
    public List<ScheduleTemplateResponse> TemplateAssignments { get; set; } = new();
    public List<ScheduleCountryTimingResponse> CountryTimings { get; set; } = new();

    // Summary fields
    public int TotalCompanies { get; set; }
    public int TotalContacts { get; set; }
    public int TotalCountries { get; set; }
    public DateOnly? NextRunDate { get; set; }
}

public class ScheduleListResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Recurrence { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public int TotalCompanies { get; set; }
    public int TotalContacts { get; set; }
    public string? TemplateName { get; set; }
    public DateOnly? NextRunDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ScheduleCompanyResponse
{
    public string CompanyName { get; set; } = string.Empty;
    public int ContactCount { get; set; }
    public string? Industry { get; set; }
    public string? Region { get; set; }
    public List<string> Countries { get; set; } = new();
}

public class ScheduleTemplateResponse
{
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string SequencePosition { get; set; } = string.Empty;
}

public class ScheduleCountryTimingResponse
{
    public string CountryName { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public string SendTime { get; set; } = string.Empty;
    public bool WeekdaysOnly { get; set; }
    public int ContactCount { get; set; }
}

public class SchedulePreviewResponse
{
    public int TotalContacts { get; set; }
    public int ContactsToSend { get; set; }
    public int ContactsExcluded { get; set; }
    public List<ExclusionSummary> Exclusions { get; set; } = new();
    public List<CountryBreakdown> CountryBreakdown { get; set; } = new();
    public DateTime? FirstSendTime { get; set; }
}

public class ExclusionSummary
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CountryBreakdown
{
    public string CountryName { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public string SendTime { get; set; } = string.Empty;
    public int ContactCount { get; set; }
    public int ExcludedCount { get; set; }
}

public class ScheduleRunResponse
{
    public Guid Id { get; set; }
    public DateOnly RunDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ContactsTargeted { get; set; }
    public int ContactsSent { get; set; }
    public int ContactsSkipped { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

// ============== Company Selection DTOs ==============

public class CompanyWithContactsResponse
{
    public string CompanyName { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Region { get; set; }
    public int ContactCount { get; set; }
    public List<string> Countries { get; set; } = new();
}

public class CompanyFilters
{
    public List<string>? Industries { get; set; }
    public List<string>? Regions { get; set; }
    public string? Search { get; set; }
}