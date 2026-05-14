namespace ContactManagement.API.Models;

public class Schedule
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // 'first_only' | 'second_only' | 'full_sequence'
    public string SequenceType { get; set; } = "first_only";

    // 'draft' | 'active' | 'paused' | 'completed' | 'archived'
    public string Status { get; set; } = "draft";

    // 'once' | 'weekly' | 'biweekly' | 'monthly'
    public string Recurrence { get; set; } = "once";

    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ScheduleCompany> Companies { get; set; } = new List<ScheduleCompany>();
    public ICollection<ScheduleTemplateAssignment> TemplateAssignments { get; set; } = new List<ScheduleTemplateAssignment>();
    public ICollection<ScheduleCountryTiming> CountryTimings { get; set; } = new List<ScheduleCountryTiming>();
    public ICollection<ScheduleRun> Runs { get; set; } = new List<ScheduleRun>();
}