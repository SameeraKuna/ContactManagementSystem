namespace ContactManagement.API.Models;

public class ScheduleCompany
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }

    // Links to Contact.CompanyName (no separate Companies table)
    public string CompanyName { get; set; } = string.Empty;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Schedule Schedule { get; set; } = null!;
}