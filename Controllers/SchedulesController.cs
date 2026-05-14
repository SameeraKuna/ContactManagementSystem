using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ContactManagement.API.Data;
using ContactManagement.API.DTOs;
using ContactManagement.API.Models;
using ContactManagement.API.Helpers;

namespace ContactManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SchedulesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all schedules (list view)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ScheduleListResponse>>> GetSchedules()
    {
        var schedules = await _context.Schedules
            .Include(s => s.Companies)
            .Include(s => s.TemplateAssignments)
                .ThenInclude(ta => ta.Template)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var result = new List<ScheduleListResponse>();
        foreach (var schedule in schedules)
        {
            var companyNames = schedule.Companies.Select(c => c.CompanyName).ToList();
            var contactCount = await _context.Contacts
                .Where(c => companyNames.Contains(c.CompanyName))
                .Where(c => c.Status != "Unsubscribed" && c.UnsubscribedAt == null)
                .CountAsync();

            result.Add(new ScheduleListResponse
            {
                Id = schedule.Id,
                Name = schedule.Name,
                Status = schedule.Status,
                Recurrence = schedule.Recurrence,
                StartDate = schedule.StartDate,
                TotalCompanies = schedule.Companies.Count,
                TotalContacts = contactCount,
                TemplateName = schedule.TemplateAssignments.FirstOrDefault()?.Template?.Name,
                NextRunDate = CalculateNextRunDate(schedule),
                CreatedAt = schedule.CreatedAt
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Get a single schedule by ID with full details
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleResponse>> GetSchedule(Guid id)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Companies)
            .Include(s => s.TemplateAssignments)
                .ThenInclude(ta => ta.Template)
            .Include(s => s.CountryTimings)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule == null)
            return NotFound();

        var companyNames = schedule.Companies.Select(c => c.CompanyName).ToList();
        var contacts = await _context.Contacts
            .Where(c => companyNames.Contains(c.CompanyName))
            .Where(c => c.Status != "Unsubscribed" && c.UnsubscribedAt == null)
            .ToListAsync();

        var response = new ScheduleResponse
        {
            Id = schedule.Id,
            Name = schedule.Name,
            SequenceType = schedule.SequenceType,
            Status = schedule.Status,
            Recurrence = schedule.Recurrence,
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            CreatedAt = schedule.CreatedAt,
            UpdatedAt = schedule.UpdatedAt,
            TotalCompanies = schedule.Companies.Count,
            TotalContacts = contacts.Count,
            TotalCountries = contacts.Select(c => c.Country).Distinct().Count(),
            NextRunDate = CalculateNextRunDate(schedule),
            Companies = schedule.Companies.Select(c => new ScheduleCompanyResponse
            {
                CompanyName = c.CompanyName,
                ContactCount = contacts.Count(ct => ct.CompanyName == c.CompanyName),
                Industry = contacts.FirstOrDefault(ct => ct.CompanyName == c.CompanyName)?.Industry,
                Countries = contacts.Where(ct => ct.CompanyName == c.CompanyName && ct.Country != null)
                                   .Select(ct => ct.Country!).Distinct().ToList()
            }).ToList(),
            TemplateAssignments = schedule.TemplateAssignments.Select(ta => new ScheduleTemplateResponse
            {
                TemplateId = ta.TemplateId,
                TemplateName = ta.Template?.Name ?? "",
                Subject = ta.Template?.SubjectLine ?? "",
                SequencePosition = ta.SequencePosition
            }).ToList(),
            CountryTimings = schedule.CountryTimings.Select(ct => new ScheduleCountryTimingResponse
            {
                CountryName = ct.CountryName,
                Timezone = ct.Timezone,
                SendTime = ct.SendTime.ToString(@"hh\:mm"),
                WeekdaysOnly = ct.WeekdaysOnly,
                ContactCount = contacts.Count(c => c.Country == ct.CountryName)
            }).ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Create a new schedule
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ScheduleResponse>> CreateSchedule([FromBody] CreateScheduleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Schedule name is required");

        if (!request.CompanyNames.Any())
            return BadRequest("At least one company must be selected");

        if (!request.TemplateAssignments.Any())
            return BadRequest("At least one template must be assigned");

        var schedule = new Schedule
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            SequenceType = request.SequenceType,
            Recurrence = request.Recurrence,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = "draft",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add companies
        foreach (var companyName in request.CompanyNames)
        {
            schedule.Companies.Add(new ScheduleCompany
            {
                Id = Guid.NewGuid(),
                ScheduleId = schedule.Id,
                CompanyName = companyName
            });
        }

        // Verify templates exist and add assignments
        foreach (var ta in request.TemplateAssignments)
        {
            var template = await _context.EmailTemplates.FindAsync(ta.TemplateId);
            if (template == null)
                return BadRequest($"Template with ID {ta.TemplateId} not found");

            schedule.TemplateAssignments.Add(new ScheduleTemplateAssignment
            {
                Id = Guid.NewGuid(),
                ScheduleId = schedule.Id,
                TemplateId = ta.TemplateId,
                SequencePosition = ta.SequencePosition
            });
        }

        // Add country timings
        foreach (var ct in request.CountryTimings)
        {
            if (!TimeSpan.TryParse(ct.SendTime, out var sendTime))
                return BadRequest($"Invalid send time format: {ct.SendTime}");

            schedule.CountryTimings.Add(new ScheduleCountryTiming
            {
                Id = Guid.NewGuid(),
                ScheduleId = schedule.Id,
                CountryName = ct.CountryName,
                Timezone = ct.Timezone,
                SendTime = sendTime,
                WeekdaysOnly = ct.WeekdaysOnly
            });
        }

        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, await GetScheduleResponse(schedule.Id));
    }

    /// <summary>
    /// Update an existing schedule
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ScheduleResponse>> UpdateSchedule(Guid id, [FromBody] UpdateScheduleRequest request)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Companies)
            .Include(s => s.TemplateAssignments)
            .Include(s => s.CountryTimings)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule == null)
            return NotFound();

        if (schedule.Status == "completed")
            return BadRequest("Cannot modify a completed schedule");

        // Update basic fields
        if (!string.IsNullOrWhiteSpace(request.Name))
            schedule.Name = request.Name;
        if (!string.IsNullOrWhiteSpace(request.SequenceType))
            schedule.SequenceType = request.SequenceType;
        if (!string.IsNullOrWhiteSpace(request.Recurrence))
            schedule.Recurrence = request.Recurrence;
        if (request.StartDate.HasValue)
            schedule.StartDate = request.StartDate.Value;
        schedule.EndDate = request.EndDate;
        schedule.UpdatedAt = DateTime.UtcNow;

        // Update companies if provided
        if (request.CompanyNames != null)
        {
            _context.ScheduleCompanies.RemoveRange(schedule.Companies);
            foreach (var companyName in request.CompanyNames)
            {
                schedule.Companies.Add(new ScheduleCompany
                {
                    Id = Guid.NewGuid(),
                    ScheduleId = schedule.Id,
                    CompanyName = companyName
                });
            }
        }

        // Update template assignments if provided
        if (request.TemplateAssignments != null)
        {
            _context.ScheduleTemplateAssignments.RemoveRange(schedule.TemplateAssignments);
            foreach (var ta in request.TemplateAssignments)
            {
                schedule.TemplateAssignments.Add(new ScheduleTemplateAssignment
                {
                    Id = Guid.NewGuid(),
                    ScheduleId = schedule.Id,
                    TemplateId = ta.TemplateId,
                    SequencePosition = ta.SequencePosition
                });
            }
        }

        // Update country timings if provided
        if (request.CountryTimings != null)
        {
            _context.ScheduleCountryTimings.RemoveRange(schedule.CountryTimings);
            foreach (var ct in request.CountryTimings)
            {
                if (TimeSpan.TryParse(ct.SendTime, out var sendTime))
                {
                    schedule.CountryTimings.Add(new ScheduleCountryTiming
                    {
                        Id = Guid.NewGuid(),
                        ScheduleId = schedule.Id,
                        CountryName = ct.CountryName,
                        Timezone = ct.Timezone,
                        SendTime = sendTime,
                        WeekdaysOnly = ct.WeekdaysOnly
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(await GetScheduleResponse(schedule.Id));
    }

    /// <summary>
    /// Delete a schedule
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSchedule(Guid id)
    {
        var schedule = await _context.Schedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        if (schedule.Status == "running")
            return BadRequest("Cannot delete a running schedule");

        _context.Schedules.Remove(schedule);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Activate a schedule (change status to active)
    /// </summary>
    [HttpPost("{id}/activate")]
    public async Task<ActionResult<ScheduleResponse>> ActivateSchedule(Guid id)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Companies)
            .Include(s => s.TemplateAssignments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule == null)
            return NotFound();

        if (!schedule.Companies.Any())
            return BadRequest("Schedule must have at least one company");

        if (!schedule.TemplateAssignments.Any())
            return BadRequest("Schedule must have at least one template");

        schedule.Status = "active";
        schedule.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(await GetScheduleResponse(schedule.Id));
    }

    /// <summary>
    /// Pause a schedule
    /// </summary>
    [HttpPost("{id}/pause")]
    public async Task<ActionResult<ScheduleResponse>> PauseSchedule(Guid id)
    {
        var schedule = await _context.Schedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        schedule.Status = "paused";
        schedule.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(await GetScheduleResponse(schedule.Id));
    }

    /// <summary>
    /// Get preview of what will be sent
    /// </summary>
    [HttpPost("{id}/preview")]
    public async Task<ActionResult<SchedulePreviewResponse>> GetSchedulePreview(Guid id)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Companies)
            .Include(s => s.CountryTimings)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule == null)
            return NotFound();

        var companyNames = schedule.Companies.Select(c => c.CompanyName).ToList();
        var contacts = await _context.Contacts
            .Where(c => companyNames.Contains(c.CompanyName))
            .ToListAsync();

        var activeContacts = contacts.Where(c => c.Status != "Unsubscribed" && c.UnsubscribedAt == null).ToList();
        var excludedContacts = contacts.Where(c => c.Status == "Unsubscribed" || c.UnsubscribedAt != null).ToList();

        var countryBreakdown = activeContacts
            .GroupBy(c => c.Country ?? "Unknown")
            .Select(g => {
                var timing = schedule.CountryTimings.FirstOrDefault(ct => ct.CountryName == g.Key);
                return new CountryBreakdown
                {
                    CountryName = g.Key,
                    Timezone = timing?.Timezone ?? TimezoneHelper.GetTimezone(g.Key),
                    SendTime = timing?.SendTime.ToString(@"hh\:mm") ?? "09:00",
                    ContactCount = g.Count(),
                    ExcludedCount = excludedContacts.Count(c => c.Country == g.Key)
                };
            })
            .OrderByDescending(c => c.ContactCount)
            .ToList();

        return Ok(new SchedulePreviewResponse
        {
            TotalContacts = contacts.Count,
            ContactsToSend = activeContacts.Count,
            ContactsExcluded = excludedContacts.Count,
            Exclusions = new List<ExclusionSummary>
            {
                new ExclusionSummary { Reason = "Unsubscribed", Count = excludedContacts.Count }
            },
            CountryBreakdown = countryBreakdown
        });
    }

    // Helper methods
    private async Task<ScheduleResponse> GetScheduleResponse(Guid id)
    {
        var result = await GetSchedule(id);
        return (result.Result as OkObjectResult)?.Value as ScheduleResponse ?? new ScheduleResponse();
    }

    private DateOnly? CalculateNextRunDate(Schedule schedule)
    {
        if (schedule.Status != "active")
            return null;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (schedule.StartDate > today)
            return schedule.StartDate;

        if (schedule.EndDate.HasValue && schedule.EndDate < today)
            return null;

        return schedule.Recurrence switch
        {
            "once" => schedule.StartDate >= today ? schedule.StartDate : null,
            "weekly" => GetNextWeeklyDate(schedule.StartDate, today),
            "biweekly" => GetNextBiweeklyDate(schedule.StartDate, today),
            "monthly" => GetNextMonthlyDate(schedule.StartDate, today),
            _ => null
        };
    }

    private DateOnly GetNextWeeklyDate(DateOnly startDate, DateOnly today)
    {
        var daysSinceStart = today.DayNumber - startDate.DayNumber;
        var weeksCompleted = daysSinceStart / 7;
        var nextRun = startDate.AddDays((weeksCompleted + 1) * 7);
        return nextRun;
    }

    private DateOnly GetNextBiweeklyDate(DateOnly startDate, DateOnly today)
    {
        var daysSinceStart = today.DayNumber - startDate.DayNumber;
        var periodsCompleted = daysSinceStart / 14;
        var nextRun = startDate.AddDays((periodsCompleted + 1) * 14);
        return nextRun;
    }

    private DateOnly GetNextMonthlyDate(DateOnly startDate, DateOnly today)
    {
        var nextRun = startDate;
        while (nextRun <= today)
        {
            nextRun = nextRun.AddMonths(1);
        }
        return nextRun;
    }
}