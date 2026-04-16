using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ContactManagement.API.Data;
using ContactManagement.API.Models;
using ContactManagement.API.DTOs;

namespace ContactManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContactsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContactsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all contacts with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ContactResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ContactResponseDto>>> GetContacts(
        [FromQuery] string? industry = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Contacts.AsQueryable();

        // Filter by industry
        if (!string.IsNullOrEmpty(industry))
        {
            query = query.Where(c => c.Industry == industry);
        }

        // Filter by status
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        // Search across multiple fields
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(c =>
                c.CompanyName.ToLower().Contains(searchLower) ||
                (c.FirstName != null && c.FirstName.ToLower().Contains(searchLower)) ||
                (c.LastName != null && c.LastName.ToLower().Contains(searchLower)) ||
                c.Email.ToLower().Contains(searchLower));
        }

        var contacts = await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => MapToResponseDto(c))
            .ToListAsync();

        return Ok(contacts);
    }

    /// <summary>
    /// Get a contact by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ContactResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContactResponseDto>> GetContact(Guid id)
    {
        var contact = await _context.Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = "Contact not found" });
        }

        return Ok(MapToResponseDto(contact));
    }

    /// <summary>
    /// Create a new contact
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ContactResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ContactResponseDto>> CreateContact([FromBody] CreateContactDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Check for duplicate (email + company combination)
        var existingContact = await _context.Contacts
            .FirstOrDefaultAsync(c => c.Email == dto.Email && c.CompanyName == dto.CompanyName);

        if (existingContact != null)
        {
            return Conflict(new { message = "A contact with this email already exists for this company." });
        }

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CompanyName = dto.CompanyName,
            Website = dto.Website,
            City = dto.City,
            Country = dto.Country,
            EmployeeCount = dto.EmployeeCount,
            Industry = dto.Industry,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            JobTitle = dto.JobTitle,
            Phone = dto.Phone,
            LeadSource = dto.LeadSource,
            Notes = dto.Notes,
            Status = "New",
            CreatedAt = DateTime.UtcNow
        };

        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, MapToResponseDto(contact));
    }

    /// <summary>
    /// Update an existing contact
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateContact(Guid id, [FromBody] UpdateContactDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var contact = await _context.Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = "Contact not found" });
        }

        // Update fields
        contact.CompanyName = dto.CompanyName;
        contact.Website = dto.Website;
        contact.City = dto.City;
        contact.Country = dto.Country;
        contact.EmployeeCount = dto.EmployeeCount;
        contact.Industry = dto.Industry;
        contact.FirstName = dto.FirstName;
        contact.LastName = dto.LastName;
        contact.Email = dto.Email;
        contact.JobTitle = dto.JobTitle;
        contact.Phone = dto.Phone;
        contact.LeadSource = dto.LeadSource;
        contact.Notes = dto.Notes;
        contact.Status = dto.Status ?? contact.Status;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Delete a contact
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteContact(Guid id)
    {
        var contact = await _context.Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = "Contact not found" });
        }

        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Helper method to map entity to DTO
    private static ContactResponseDto MapToResponseDto(Contact contact)
    {
        return new ContactResponseDto
        {
            Id = contact.Id,
            CompanyName = contact.CompanyName,
            Website = contact.Website,
            City = contact.City,
            Country = contact.Country,
            EmployeeCount = contact.EmployeeCount,
            Industry = contact.Industry,
            FirstName = contact.FirstName,
            LastName = contact.LastName,
            Email = contact.Email,
            JobTitle = contact.JobTitle,
            Phone = contact.Phone,
            LeadSource = contact.LeadSource,
            Notes = contact.Notes,
            Status = contact.Status,
            UnsubscribedAt = contact.UnsubscribedAt,
            CreatedAt = contact.CreatedAt
        };
    }
}