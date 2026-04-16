using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ContactManagement.API.Data;
using ContactManagement.API.Models;
using ContactManagement.API.DTOs;

namespace ContactManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmailTemplatesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EmailTemplatesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all email templates with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EmailTemplateResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmailTemplateResponseDto>>> GetEmailTemplates(
        [FromQuery] string? industry = null,
        [FromQuery] string? region = null,
        [FromQuery] string? sequence = null,
        [FromQuery] string? search = null)
    {
        var query = _context.EmailTemplates.AsQueryable();

        // Filter by industry (searches within JSON array)
        if (!string.IsNullOrEmpty(industry))
        {
            query = query.Where(t => t.Industries.Contains(industry));
        }

        // Filter by region (searches within JSON array)
        if (!string.IsNullOrEmpty(region))
        {
            query = query.Where(t => t.Regions.Contains(region));
        }

        // Filter by sequence position
        if (!string.IsNullOrEmpty(sequence))
        {
            query = query.Where(t => t.SequencePosition == sequence);
        }

        // Search across name and subject
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(searchLower) ||
                t.SubjectLine.ToLower().Contains(searchLower));
        }

        var templates = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => MapToResponseDto(t))
            .ToListAsync();

        return Ok(templates);
    }

    /// <summary>
    /// Get an email template by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EmailTemplateResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmailTemplateResponseDto>> GetEmailTemplate(Guid id)
    {
        var template = await _context.EmailTemplates.FindAsync(id);

        if (template == null)
        {
            return NotFound(new { message = "Email template not found" });
        }

        return Ok(MapToResponseDto(template));
    }

    /// <summary>
    /// Create a new email template
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(EmailTemplateResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmailTemplateResponseDto>> CreateEmailTemplate([FromBody] CreateEmailTemplateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var template = new EmailTemplate
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            SubjectLine = dto.SubjectLine,
            PreviewText = dto.PreviewText,
            Body = dto.Body,
            SequencePosition = dto.SequencePosition ?? "first",
            Industries = dto.Industries ?? "[]",
            Regions = dto.Regions ?? "[]",
            Status = dto.Status ?? "draft",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EmailTemplates.Add(template);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEmailTemplate), new { id = template.Id }, MapToResponseDto(template));
    }

    /// <summary>
    /// Update an existing email template
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEmailTemplate(Guid id, [FromBody] UpdateEmailTemplateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var template = await _context.EmailTemplates.FindAsync(id);

        if (template == null)
        {
            return NotFound(new { message = "Email template not found" });
        }

        // Update fields
        template.Name = dto.Name;
        template.SubjectLine = dto.SubjectLine;
        template.PreviewText = dto.PreviewText;
        template.Body = dto.Body;
        template.SequencePosition = dto.SequencePosition ?? template.SequencePosition;
        template.Industries = dto.Industries ?? template.Industries;
        template.Regions = dto.Regions ?? template.Regions;
        template.Status = dto.Status ?? template.Status;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Delete an email template
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmailTemplate(Guid id)
    {
        var template = await _context.EmailTemplates.FindAsync(id);

        if (template == null)
        {
            return NotFound(new { message = "Email template not found" });
        }

        _context.EmailTemplates.Remove(template);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Clone an email template
    /// </summary>
    [HttpPost("{id:guid}/clone")]
    [ProducesResponseType(typeof(EmailTemplateResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmailTemplateResponseDto>> CloneEmailTemplate(Guid id)
    {
        var template = await _context.EmailTemplates.FindAsync(id);

        if (template == null)
        {
            return NotFound(new { message = "Email template not found" });
        }

        var clonedTemplate = new EmailTemplate
        {
            Id = Guid.NewGuid(),
            Name = $"Copy of {template.Name}",
            SubjectLine = template.SubjectLine,
            PreviewText = template.PreviewText,
            Body = template.Body,
            SequencePosition = template.SequencePosition,
            Industries = template.Industries,
            Regions = template.Regions,
            Status = "draft", // Cloned templates start as draft
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EmailTemplates.Add(clonedTemplate);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEmailTemplate), new { id = clonedTemplate.Id }, MapToResponseDto(clonedTemplate));
    }

    // Helper method to map entity to DTO
    private static EmailTemplateResponseDto MapToResponseDto(EmailTemplate template)
    {
        return new EmailTemplateResponseDto
        {
            Id = template.Id,
            Name = template.Name,
            SubjectLine = template.SubjectLine,
            PreviewText = template.PreviewText,
            Body = template.Body,
            SequencePosition = template.SequencePosition,
            Industries = template.Industries,
            Regions = template.Regions,
            Status = template.Status,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }
}