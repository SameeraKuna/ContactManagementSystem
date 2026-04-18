using ContactManagement.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace ContactManagement.API.Data;   
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Contact> Contacts { get; set; } = null!;
    public DbSet<EmailTemplate> EmailTemplates { get; set; } = null!;
    public DbSet<EmailTemplateIndustry> EmailTemplateIndustries { get; set; } = null!;
    public DbSet<EmailTemplateRegion> EmailTemplateRegions { get; set; } = null!;
    public DbSet<Sequence> Sequences { get; set; } = null!;
    public DbSet<SequenceEnrolment> SequenceEnrolments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Contact configuration
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasIndex(e => new { e.Email, e.CompanyName }).IsUnique();
            entity.Property(e => e.Status).HasDefaultValue("New");
        });

        // EmailTemplate configuration
        modelBuilder.Entity<EmailTemplateIndustry>(entity =>
        {
            entity.HasKey(e => new { e.EmailTemplateId, e.IndustryName });

            entity.HasOne(e => e.EmailTemplate)
                .WithMany(t => t.Industries)
                .HasForeignKey(e => e.EmailTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailTemplateRegion>(entity =>
        {
            entity.HasKey(e => new { e.EmailTemplateId, e.RegionName });

            entity.HasOne(e => e.EmailTemplate)
                .WithMany(t => t.Regions)
                .HasForeignKey(e => e.EmailTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // Sequence configuration
        modelBuilder.Entity<Sequence>(entity =>
        {
            entity.HasOne(s => s.Template1)
                .WithMany(t => t.SequencesAsTemplate1)
                .HasForeignKey(s => s.Template1Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Template2)
                .WithMany(t => t.SequencesAsTemplate2)
                .HasForeignKey(s => s.Template2Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Status).HasDefaultValue("draft");
            entity.Property(e => e.SendTime).HasConversion(
                v => v.ToString(@"hh\:mm\:ss"),
                v => TimeSpan.Parse(v));
        });

        // SequenceEnrolment configuration
        modelBuilder.Entity<SequenceEnrolment>(entity =>
        {
            entity.HasIndex(e => new { e.ContactId, e.SequenceId }).IsUnique();

            entity.HasOne(e => e.Contact)
                .WithMany(c => c.SequenceEnrolments)
                .HasForeignKey(e => e.ContactId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sequence)
                .WithMany(s => s.Enrolments)
                .HasForeignKey(e => e.SequenceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Status).HasDefaultValue("pending");
        });
    }
}