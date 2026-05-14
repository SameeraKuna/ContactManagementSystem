namespace ContactManagement.API.Models;

public class ScheduleRunItem
{
    public Guid Id { get; set; }
    public Guid ScheduleRunId { get; set; }
    public Guid ContactId { get; set; }
    public Guid TemplateId { get; set; }

    // 'queued' | 'sent' | 'skipped' | 'failed'
    public string Status { get; set; } = "queued";

    // 'unsubscribed', 'bounced', 'already_received' or null
    public string? SkipReason { get; set; }

    // Contact's local time, converted to UTC
    public DateTime ScheduledSendAt { get; set; }

    public DateTime? SentAt { get; set; }
    public string? ProviderMessageId { get; set; }

    // Navigation properties
    public ScheduleRun ScheduleRun { get; set; } = null!;
    public Contact Contact { get; set; } = null!;
    public EmailTemplate Template { get; set; } = null!;
}