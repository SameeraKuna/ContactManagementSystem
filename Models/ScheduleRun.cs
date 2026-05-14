namespace ContactManagement.API.Models;

public class ScheduleRun
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }

    public DateOnly RunDate { get; set; }

    // 'pending' | 'in_progress' | 'completed' | 'failed'
    public string Status { get; set; } = "pending";

    public int ContactsTargeted { get; set; }
    public int ContactsSent { get; set; }
    public int ContactsSkipped { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public Schedule Schedule { get; set; } = null!;
    public ICollection<ScheduleRunItem> Items { get; set; } = new List<ScheduleRunItem>();
}