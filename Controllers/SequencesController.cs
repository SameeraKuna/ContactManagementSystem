using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ContactManagement.API.Data;
using ContactManagement.API.Models;
using ContactManagement.API.DTOs;

namespace ContactManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SequencesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SequencesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/sequences
    [HttpGet]
    public async Task<ActionResult<SequenceListResponse>> GetSequences(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(s => s.Status == status);
        }

        var totalCount = await query.CountAsync();

        var sequences = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new SequenceListResponse
        {
            Items = sequences.Select(MapToResponse).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET: api/sequences/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<SequenceResponse>> GetSequence(Guid id)
    {
        var sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        return Ok(MapToResponse(sequence));
    }

    // POST: api/sequences
    [HttpPost]
    public async Task<ActionResult<SequenceResponse>> CreateSequence([FromBody] CreateSequenceRequest request)
    {
        // Validate template1 exists and is published
        var template1 = await _context.EmailTemplates.FindAsync(request.Template1Id);
        if (template1 == null)
        {
            return BadRequest(new { error = "Template 1 not found" });
        }
        if (template1.SequencePosition != "first")
        {
            return BadRequest(new { error = "Template 1 must have sequence position 'first'" });
        }

        // Validate template2 if provided
        if (request.Template2Id.HasValue)
        {
            var template2 = await _context.EmailTemplates.FindAsync(request.Template2Id.Value);
            if (template2 == null)
            {
                return BadRequest(new { error = "Template 2 not found" });
            }
            if (template2.SequencePosition != "second")
            {
                return BadRequest(new { error = "Template 2 must have sequence position 'second'" });
            }
        }

        var sequence = new Sequence
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Template1Id = request.Template1Id,
            Template2Id = request.Template2Id,
            DelayDays = request.DelayDays,
            SendTime = TimeSpan.Parse(request.SendTime),
            SendWeekdaysOnly = request.SendWeekdaysOnly,
            Status = "draft",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Sequences.Add(sequence);
        await _context.SaveChangesAsync();

        // Reload with includes
        sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstAsync(s => s.Id == sequence.Id);

        return CreatedAtAction(nameof(GetSequence), new { id = sequence.Id }, MapToResponse(sequence));
    }

    // PUT: api/sequences/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<SequenceResponse>> UpdateSequence(Guid id, [FromBody] UpdateSequenceRequest request)
    {
        var sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        // Cannot update active sequences (must pause first)
        if (sequence.Status == "active")
        {
            return BadRequest(new { error = "Cannot update an active sequence. Pause it first." });
        }

        // Validate template1
        var template1 = await _context.EmailTemplates.FindAsync(request.Template1Id);
        if (template1 == null)
        {
            return BadRequest(new { error = "Template 1 not found" });
        }
        if (template1.SequencePosition != "first")
        {
            return BadRequest(new { error = "Template 1 must have sequence position 'first'" });
        }

        // Validate template2 if provided
        if (request.Template2Id.HasValue)
        {
            var template2 = await _context.EmailTemplates.FindAsync(request.Template2Id.Value);
            if (template2 == null)
            {
                return BadRequest(new { error = "Template 2 not found" });
            }
            if (template2.SequencePosition != "second")
            {
                return BadRequest(new { error = "Template 2 must have sequence position 'second'" });
            }
        }

        sequence.Name = request.Name;
        sequence.Template1Id = request.Template1Id;
        sequence.Template2Id = request.Template2Id;
        sequence.DelayDays = request.DelayDays;
        sequence.SendTime = TimeSpan.Parse(request.SendTime);
        sequence.SendWeekdaysOnly = request.SendWeekdaysOnly;
        sequence.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(sequence));
    }

    // DELETE: api/sequences/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSequence(Guid id)
    {
        var sequence = await _context.Sequences.FindAsync(id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        // Only allow deletion of draft sequences
        if (sequence.Status != "draft")
        {
            return BadRequest(new { error = "Only draft sequences can be deleted. Archive active sequences instead." });
        }

        _context.Sequences.Remove(sequence);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/sequences/{id}/activate
    [HttpPost("{id}/activate")]
    public async Task<ActionResult<SequenceResponse>> ActivateSequence(Guid id)
    {
        var sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        if (sequence.Status == "active")
        {
            return BadRequest(new { error = "Sequence is already active" });
        }

        if (sequence.Status == "archived")
        {
            return BadRequest(new { error = "Cannot activate an archived sequence" });
        }

        sequence.Status = "active";
        sequence.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(sequence));
    }

    // POST: api/sequences/{id}/pause
    [HttpPost("{id}/pause")]
    public async Task<ActionResult<SequenceResponse>> PauseSequence(Guid id)
    {
        var sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        if (sequence.Status != "active")
        {
            return BadRequest(new { error = "Only active sequences can be paused" });
        }

        sequence.Status = "paused";
        sequence.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(sequence));
    }

    // POST: api/sequences/{id}/resume
    [HttpPost("{id}/resume")]
    public async Task<ActionResult<SequenceResponse>> ResumeSequence(Guid id)
    {
        var sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        if (sequence.Status != "paused")
        {
            return BadRequest(new { error = "Only paused sequences can be resumed" });
        }

        sequence.Status = "active";
        sequence.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(sequence));
    }

    // POST: api/sequences/{id}/archive
    [HttpPost("{id}/archive")]
    public async Task<ActionResult<SequenceResponse>> ArchiveSequence(Guid id)
    {
        var sequence = await _context.Sequences
            .Include(s => s.Template1)
            .Include(s => s.Template2)
            .Include(s => s.Enrolments)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        if (sequence.Status == "archived")
        {
            return BadRequest(new { error = "Sequence is already archived" });
        }

        sequence.Status = "archived";
        sequence.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(sequence));
    }

    // POST: api/sequences/{id}/enrol
    [HttpPost("{id}/enrol")]
    public async Task<ActionResult<EnrolmentResult>> EnrolContacts(Guid id, [FromBody] EnrolContactsRequest request)
    {
        var sequence = await _context.Sequences.FindAsync(id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        // Sequence must be active to enrol contacts
        if (sequence.Status != "active")
        {
            return BadRequest(new { error = "Can only enrol contacts in active sequences" });
        }

        var result = new EnrolmentResult
        {
            TotalRequested = request.ContactIds.Count
        };

        var existingEnrolments = await _context.SequenceEnrolments
            .Where(e => e.SequenceId == id && request.ContactIds.Contains(e.ContactId))
            .Select(e => e.ContactId)
            .ToListAsync();

        var contacts = await _context.Contacts
            .Where(c => request.ContactIds.Contains(c.Id))
            .ToListAsync();

        foreach (var contactId in request.ContactIds)
        {
            // Check if already enrolled
            if (existingEnrolments.Contains(contactId))
            {
                result.AlreadyEnrolled++;
                continue;
            }

            var contact = contacts.FirstOrDefault(c => c.Id == contactId);
            if (contact == null)
            {
                continue;
            }

            // Skip unsubscribed or bounced contacts
            if (contact.Status == "Unsubscribed" || contact.Status == "Bounced")
            {
                result.SkippedDueToStatus++;
                continue;
            }

            // Calculate next send time
            var nextSendAt = CalculateNextSendTime(sequence.SendTime, sequence.SendWeekdaysOnly);

            var enrolment = new SequenceEnrolment
            {
                Id = Guid.NewGuid(),
                ContactId = contactId,
                SequenceId = id,
                CurrentStep = 1,
                Status = "pending",
                NextSendAt = nextSendAt,
                EnrolledAt = DateTime.UtcNow
            };

            _context.SequenceEnrolments.Add(enrolment);
            result.SuccessfullyEnrolled++;
            result.Enrolments.Add(new EnrolmentResponse
            {
                Id = enrolment.Id,
                ContactId = enrolment.ContactId,
                SequenceId = enrolment.SequenceId,
                CurrentStep = enrolment.CurrentStep,
                Status = enrolment.Status,
                NextSendAt = enrolment.NextSendAt,
                EnrolledAt = enrolment.EnrolledAt,
                Contact = new ContactInfo
                {
                    Id = contact.Id,
                    FirstName = contact.FirstName ?? "",
                    LastName = contact.LastName ?? "",
                    Email = contact.Email,
                    CompanyName = contact.CompanyName,
                    Status = contact.Status
                }
            });
        }

        await _context.SaveChangesAsync();

        return Ok(result);
    }

    // GET: api/sequences/{id}/enrolments
    [HttpGet("{id}/enrolments")]
    public async Task<ActionResult<List<EnrolmentResponse>>> GetEnrolments(
        Guid id,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var sequence = await _context.Sequences.FindAsync(id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        var query = _context.SequenceEnrolments
            .Include(e => e.Contact)
            .Where(e => e.SequenceId == id);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(e => e.Status == status);
        }

        var enrolments = await query
            .OrderByDescending(e => e.EnrolledAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(enrolments.Select(e => new EnrolmentResponse
        {
            Id = e.Id,
            ContactId = e.ContactId,
            SequenceId = e.SequenceId,
            CurrentStep = e.CurrentStep,
            Status = e.Status,
            NextSendAt = e.NextSendAt,
            EnrolledAt = e.EnrolledAt,
            CompletedAt = e.CompletedAt,
            Contact = e.Contact != null ? new ContactInfo
            {
                Id = e.Contact.Id,
                FirstName = e.Contact.FirstName ?? "",
                LastName = e.Contact.LastName ?? "",
                Email = e.Contact.Email,
                CompanyName = e.Contact.CompanyName,
                Status = e.Contact.Status
            } : null
        }).ToList());
    }

    // GET: api/sequences/{id}/stats
    [HttpGet("{id}/stats")]
    public async Task<ActionResult<SequenceStatsResponse>> GetSequenceStats(Guid id)
    {
        var sequence = await _context.Sequences.FindAsync(id);

        if (sequence == null)
        {
            return NotFound(new { error = "Sequence not found" });
        }

        var stats = await _context.SequenceEnrolments
            .Where(e => e.SequenceId == id)
            .GroupBy(e => e.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        return Ok(new SequenceStatsResponse
        {
            TotalEnrolments = stats.Sum(s => s.Count),
            PendingCount = stats.FirstOrDefault(s => s.Status == "pending")?.Count ?? 0,
            SentCount = stats.FirstOrDefault(s => s.Status == "sent")?.Count ?? 0,
            CompletedCount = stats.FirstOrDefault(s => s.Status == "completed")?.Count ?? 0,
            BouncedCount = stats.FirstOrDefault(s => s.Status == "bounced")?.Count ?? 0,
            UnsubscribedCount = stats.FirstOrDefault(s => s.Status == "unsubscribed")?.Count ?? 0
        });
    }

    // DELETE: api/sequences/{id}/enrolments/{enrolmentId}
    [HttpDelete("{id}/enrolments/{enrolmentId}")]
    public async Task<IActionResult> RemoveEnrolment(Guid id, Guid enrolmentId)
    {
        var enrolment = await _context.SequenceEnrolments
            .FirstOrDefaultAsync(e => e.Id == enrolmentId && e.SequenceId == id);

        if (enrolment == null)
        {
            return NotFound(new { error = "Enrolment not found" });
        }

        // Only allow removal of pending enrolments
        if (enrolment.Status != "pending")
        {
            return BadRequest(new { error = "Can only remove pending enrolments" });
        }

        _context.SequenceEnrolments.Remove(enrolment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Helper methods
    private static SequenceResponse MapToResponse(Sequence sequence)
    {
        return new SequenceResponse
        {
            Id = sequence.Id,
            Name = sequence.Name,
            Template1Id = sequence.Template1Id,
            Template2Id = sequence.Template2Id,
            DelayDays = sequence.DelayDays,
            SendTime = sequence.SendTime.ToString(@"hh\:mm"),
            SendWeekdaysOnly = sequence.SendWeekdaysOnly,
            Status = sequence.Status,
            CreatedAt = sequence.CreatedAt,
            UpdatedAt = sequence.UpdatedAt,
            Template1 = sequence.Template1 != null ? new TemplateInfo
            {
                Id = sequence.Template1.Id,
                Name = sequence.Template1.Name,
                SubjectLine = sequence.Template1.SubjectLine,
                SequencePosition = sequence.Template1.SequencePosition
            } : null,
            Template2 = sequence.Template2 != null ? new TemplateInfo
            {
                Id = sequence.Template2.Id,
                Name = sequence.Template2.Name,
                SubjectLine = sequence.Template2.SubjectLine,
                SequencePosition = sequence.Template2.SequencePosition
            } : null,
            EnrolmentCount = sequence.Enrolments?.Count ?? 0
        };
    }

    private static DateTime CalculateNextSendTime(TimeSpan sendTime, bool weekdaysOnly)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var scheduledTime = today.Add(sendTime);

        // If the time has passed today, schedule for tomorrow
        if (scheduledTime <= now)
        {
            scheduledTime = scheduledTime.AddDays(1);
        }

        // If weekdays only, skip to next weekday
        if (weekdaysOnly)
        {
            while (scheduledTime.DayOfWeek == DayOfWeek.Saturday ||
                   scheduledTime.DayOfWeek == DayOfWeek.Sunday)
            {
                scheduledTime = scheduledTime.AddDays(1);
            }
        }

        return scheduledTime;
    }
}