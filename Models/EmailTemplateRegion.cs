namespace ContactManagement.API.Models;

public class EmailTemplateRegion
{
    public Guid EmailTemplateId { get; set; }
    public EmailTemplate EmailTemplate { get; set; } = null!;

    public string RegionName { get; set; } = string.Empty;
}