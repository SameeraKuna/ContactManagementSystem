namespace ContactManagement.API.Helpers;

public static class TimezoneHelper
{
    // Common country to IANA timezone mappings
    private static readonly Dictionary<string, string> CountryTimezones = new(StringComparer.OrdinalIgnoreCase)
    {
        // Europe
        { "United Kingdom", "Europe/London" },
        { "UK", "Europe/London" },
        { "Germany", "Europe/Berlin" },
        { "France", "Europe/Paris" },
        { "Spain", "Europe/Madrid" },
        { "Italy", "Europe/Rome" },
        { "Netherlands", "Europe/Amsterdam" },
        { "Belgium", "Europe/Brussels" },
        { "Switzerland", "Europe/Zurich" },
        { "Austria", "Europe/Vienna" },
        { "Sweden", "Europe/Stockholm" },
        { "Norway", "Europe/Oslo" },
        { "Denmark", "Europe/Copenhagen" },
        { "Finland", "Europe/Helsinki" },
        { "Poland", "Europe/Warsaw" },
        { "Ireland", "Europe/Dublin" },
        { "Portugal", "Europe/Lisbon" },
        { "Greece", "Europe/Athens" },
        { "Czech Republic", "Europe/Prague" },
        { "Romania", "Europe/Bucharest" },
        { "Hungary", "Europe/Budapest" },
        
        // North America
        { "USA", "America/New_York" },
        { "United States", "America/New_York" },
        { "US", "America/New_York" },
        { "Canada", "America/Toronto" },
        { "Mexico", "America/Mexico_City" },
        
        // Asia Pacific
        { "Japan", "Asia/Tokyo" },
        { "China", "Asia/Shanghai" },
        { "India", "Asia/Kolkata" },
        { "Singapore", "Asia/Singapore" },
        { "Hong Kong", "Asia/Hong_Kong" },
        { "South Korea", "Asia/Seoul" },
        { "Australia", "Australia/Sydney" },
        { "New Zealand", "Pacific/Auckland" },
        { "Indonesia", "Asia/Jakarta" },
        { "Malaysia", "Asia/Kuala_Lumpur" },
        { "Thailand", "Asia/Bangkok" },
        { "Vietnam", "Asia/Ho_Chi_Minh" },
        { "Philippines", "Asia/Manila" },
        { "Taiwan", "Asia/Taipei" },
        
        // Middle East
        { "UAE", "Asia/Dubai" },
        { "United Arab Emirates", "Asia/Dubai" },
        { "Saudi Arabia", "Asia/Riyadh" },
        { "Israel", "Asia/Jerusalem" },
        { "Turkey", "Europe/Istanbul" },
        
        // South America
        { "Brazil", "America/Sao_Paulo" },
        { "Argentina", "America/Buenos_Aires" },
        { "Chile", "America/Santiago" },
        { "Colombia", "America/Bogota" },
        { "Peru", "America/Lima" },
        
        // Africa
        { "South Africa", "Africa/Johannesburg" },
        { "Nigeria", "Africa/Lagos" },
        { "Egypt", "Africa/Cairo" },
        { "Kenya", "Africa/Nairobi" },
        { "Morocco", "Africa/Casablanca" }
    };

    /// <summary>
    /// Get timezone for a given country name
    /// </summary>
    public static string GetTimezone(string? country)
    {
        if (string.IsNullOrWhiteSpace(country))
            return "UTC";

        return CountryTimezones.TryGetValue(country.Trim(), out var tz) ? tz : "UTC";
    }

    /// <summary>
    /// Get UTC offset string for a timezone (e.g., "UTC+1")
    /// </summary>
    public static string GetUtcOffsetString(string timezone)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(GetWindowsTimezoneId(timezone));
            var offset = tz.BaseUtcOffset;
            if (offset == TimeSpan.Zero)
                return "UTC";
            var sign = offset >= TimeSpan.Zero ? "+" : "";
            return $"UTC{sign}{offset.Hours}";
        }
        catch
        {
            return "UTC";
        }
    }

    /// <summary>
    /// Convert IANA timezone to Windows timezone ID
    /// </summary>
    private static string GetWindowsTimezoneId(string ianaTimezone)
    {
        // Map common IANA timezones to Windows timezone IDs
        var mapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Europe/London", "GMT Standard Time" },
            { "Europe/Berlin", "W. Europe Standard Time" },
            { "Europe/Paris", "Romance Standard Time" },
            { "Europe/Madrid", "Romance Standard Time" },
            { "Europe/Rome", "W. Europe Standard Time" },
            { "Europe/Amsterdam", "W. Europe Standard Time" },
            { "Europe/Brussels", "Romance Standard Time" },
            { "Europe/Zurich", "W. Europe Standard Time" },
            { "Europe/Vienna", "W. Europe Standard Time" },
            { "Europe/Stockholm", "W. Europe Standard Time" },
            { "Europe/Oslo", "W. Europe Standard Time" },
            { "Europe/Copenhagen", "Romance Standard Time" },
            { "Europe/Helsinki", "FLE Standard Time" },
            { "Europe/Warsaw", "Central European Standard Time" },
            { "Europe/Dublin", "GMT Standard Time" },
            { "Europe/Lisbon", "GMT Standard Time" },
            { "Europe/Athens", "GTB Standard Time" },
            { "Europe/Prague", "Central Europe Standard Time" },
            { "Europe/Bucharest", "GTB Standard Time" },
            { "Europe/Budapest", "Central Europe Standard Time" },
            { "Europe/Istanbul", "Turkey Standard Time" },
            { "America/New_York", "Eastern Standard Time" },
            { "America/Chicago", "Central Standard Time" },
            { "America/Denver", "Mountain Standard Time" },
            { "America/Los_Angeles", "Pacific Standard Time" },
            { "America/Toronto", "Eastern Standard Time" },
            { "America/Mexico_City", "Central Standard Time (Mexico)" },
            { "America/Sao_Paulo", "E. South America Standard Time" },
            { "America/Buenos_Aires", "Argentina Standard Time" },
            { "America/Santiago", "Pacific SA Standard Time" },
            { "America/Bogota", "SA Pacific Standard Time" },
            { "America/Lima", "SA Pacific Standard Time" },
            { "Asia/Tokyo", "Tokyo Standard Time" },
            { "Asia/Shanghai", "China Standard Time" },
            { "Asia/Kolkata", "India Standard Time" },
            { "Asia/Singapore", "Singapore Standard Time" },
            { "Asia/Hong_Kong", "China Standard Time" },
            { "Asia/Seoul", "Korea Standard Time" },
            { "Asia/Dubai", "Arabian Standard Time" },
            { "Asia/Riyadh", "Arab Standard Time" },
            { "Asia/Jerusalem", "Israel Standard Time" },
            { "Asia/Jakarta", "SE Asia Standard Time" },
            { "Asia/Kuala_Lumpur", "Singapore Standard Time" },
            { "Asia/Bangkok", "SE Asia Standard Time" },
            { "Asia/Ho_Chi_Minh", "SE Asia Standard Time" },
            { "Asia/Manila", "Singapore Standard Time" },
            { "Asia/Taipei", "Taipei Standard Time" },
            { "Australia/Sydney", "AUS Eastern Standard Time" },
            { "Pacific/Auckland", "New Zealand Standard Time" },
            { "Africa/Johannesburg", "South Africa Standard Time" },
            { "Africa/Lagos", "W. Central Africa Standard Time" },
            { "Africa/Cairo", "Egypt Standard Time" },
            { "Africa/Nairobi", "E. Africa Standard Time" },
            { "Africa/Casablanca", "Morocco Standard Time" },
            { "UTC", "UTC" }
        };

        return mapping.TryGetValue(ianaTimezone, out var windowsId) ? windowsId : "UTC";
    }

    /// <summary>
    /// Get all supported countries
    /// </summary>
    public static IReadOnlyDictionary<string, string> GetAllCountryTimezones() => CountryTimezones;
}