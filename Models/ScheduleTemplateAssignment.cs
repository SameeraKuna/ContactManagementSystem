namespace ContactManagement.API.Models;

public class ScheduleTemplateAssignment
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public Guid TemplateId { get; set; }

    // 'first' | 'second'
    public string SequencePosition { get; set; } = "first";

    // Navigation properties
    public Schedule Schedule { get; set; } = null!;
    public EmailTemplate Template { get; set; } = null!;
}