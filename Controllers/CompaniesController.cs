using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ContactManagement.API.Data;
using ContactManagement.API.DTOs;
using ContactManagement.API.Helpers;

namespace ContactManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CompaniesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all companies with contact counts for schedule builder
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CompanyWithContactsResponse>>> GetCompanies(
        [FromQuery] string? industry = null,
        [FromQuery] string? region = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Contacts
            .Where(c => c.Status != "Unsubscribed" && c.UnsubscribedAt == null)
            .Where(c => !string.IsNullOrEmpty(c.CompanyName));

        // Apply filters
        if (!string.IsNullOrEmpty(industry))
            query = query.Where(c => c.Industry == industry);

        if (!string.IsNullOrEmpty(region))
        {
            // Filter by region - would need to map countries to regions
            // For now, use country directly if region matches known pattern
            query = query.Where(c => c.Country != null && c.Country.Contains(region));
        }

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.CompanyName.Contains(search));

        var companies = await query
            .GroupBy(c => c.CompanyName)
            .Select(g => new CompanyWithContactsResponse
            {
                CompanyName = g.Key,
                Industry = g.Select(c => c.Industry).FirstOrDefault(),
                ContactCount = g.Count(),
                Countries = g.Where(c => c.Country != null)
                             .Select(c => c.Country!)
                             .Distinct()
                             .ToList()
            })
            .OrderBy(c => c.CompanyName)
            .ToListAsync();

        return Ok(companies);
    }

    /// <summary>
    /// Get distinct industries from contacts
    /// </summary>
    [HttpGet("industries")]
    public async Task<ActionResult<List<string>>> GetIndustries()
    {
        var industries = await _context.Contacts
            .Where(c => !string.IsNullOrEmpty(c.Industry))
            .Select(c => c.Industry!)
            .Distinct()
            .OrderBy(i => i)
            .ToListAsync();

        return Ok(industries);
    }

    /// <summary>
    /// Get distinct countries from contacts
    /// </summary>
    [HttpGet("countries")]
    public async Task<ActionResult<List<object>>> GetCountries()
    {
        var countries = await _context.Contacts
            .Where(c => !string.IsNullOrEmpty(c.Country))
            .Select(c => c.Country!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        var result = countries.Select(c => new
        {
            name = c,
            timezone = TimezoneHelper.GetTimezone(c),
            utcOffset = TimezoneHelper.GetUtcOffsetString(TimezoneHelper.GetTimezone(c))
        });

        return Ok(result);
    }

    /// <summary>
    /// Get contacts for selected companies (for preview)
    /// </summary>
    [HttpPost("contacts")]
    public async Task<ActionResult<object>> GetContactsForCompanies([FromBody] List<string> companyNames)
    {
        if (companyNames == null || !companyNames.Any())
            return BadRequest("At least one company name is required");

        var contacts = await _context.Contacts
            .Where(c => companyNames.Contains(c.CompanyName))
            .Where(c => c.Status != "Unsubscribed" && c.UnsubscribedAt == null)
            .Select(c => new
            {
                c.Id,
                c.Email,
                c.FirstName,
                c.LastName,
                c.CompanyName,
                c.Country,
                c.Status
            })
            .ToListAsync();

        // Group by country for timing purposes
        var byCountry = contacts
            .GroupBy(c => c.Country ?? "Unknown")
            .Select(g => new
            {
                country = g.Key,
                timezone = TimezoneHelper.GetTimezone(g.Key),
                contactCount = g.Count()
            })
            .OrderByDescending(c => c.contactCount)
            .ToList();

        return Ok(new
        {
            totalContacts = contacts.Count,
            countryBreakdown = byCountry
        });
    }
}