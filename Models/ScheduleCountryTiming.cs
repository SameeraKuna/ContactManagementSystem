namespace ContactManagement.API.Models;

public class ScheduleCountryTiming
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }

    // e.g., "United Kingdom"
    public string CountryName { get; set; } = string.Empty;

    // IANA timezone, e.g., "Europe/London"
    public string Timezone { get; set; } = "UTC";

    // e.g., 09:00:00
    public TimeSpan SendTime { get; set; } = new TimeSpan(9, 0, 0);

    public bool WeekdaysOnly { get; set; } = true;

    // Navigation property
    public Schedule Schedule { get; set; } = null!;
}