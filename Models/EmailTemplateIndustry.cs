namespace ContactManagement.API.Models;

public class EmailTemplateIndustry
{
    public Guid EmailTemplateId { get; set; }
    public EmailTemplate EmailTemplate { get; set; } = null!;

    public string IndustryName { get; set; } = string.Empty;
}