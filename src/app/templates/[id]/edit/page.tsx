'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getEmailTemplate, updateEmailTemplate, EmailTemplate, INDUSTRY_OPTIONS, REGION_OPTIONS, SEQUENCE_POSITION_OPTIONS, TEMPLATE_STATUS_OPTIONS } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<EmailTemplate>({
    name: '',
    subjectLine: '',
    previewText: '',
    body: '',
    sequencePosition: 'first',
    industries: '[]',
    regions: '[]',
    status: 'draft',
  });

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const template = await getEmailTemplate(templateId);
        setFormData(template);
        setSelectedIndustries(template.industries ? JSON.parse(template.industries) : []);
        setSelectedRegions(template.regions ? JSON.parse(template.regions) : []);
      } catch (err) {
        setError('Failed to load template');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [templateId]);

  const updateField = (field: keyof EmailTemplate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleIndustry = (industry: string) => {
    const updated = selectedIndustries.includes(industry)
      ? selectedIndustries.filter(i => i !== industry)
      : [...selectedIndustries, industry];
    setSelectedIndustries(updated);
    setFormData(prev => ({ ...prev, industries: JSON.stringify(updated) }));
  };

  const toggleRegion = (region: string) => {
    const updated = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    setSelectedRegions(updated);
    setFormData(prev => ({ ...prev, regions: JSON.stringify(updated) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!formData.subjectLine.trim()) {
      setError('Subject line is required');
      return;
    }
    if (!formData.body.trim()) {
      setError('Email body is required');
      return;
    }

    try {
      setSaving(true);
      await updateEmailTemplate(templateId, formData);
      router.push('/templates');
    } catch (err) {
      setError('Failed to update template. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/templates" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-gray-600 mt-1">Update your email template</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card title="Basic Information">
            <div className="space-y-4">
              <Input
                label="Template Name"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Initial Outreach - Tech Companies"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Sequence Position"
                  options={[...SEQUENCE_POSITION_OPTIONS]}
                  value={formData.sequencePosition || 'first'}
                  onChange={(e) => updateField('sequencePosition', e.target.value)}
                />
                <Select
                  label="Status"
                  options={[...TEMPLATE_STATUS_OPTIONS]}
                  value={formData.status || 'draft'}
                  onChange={(e) => updateField('status', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card title="Email Content">
            <div className="space-y-4">
              <Input
                label="Subject Line"
                required
                value={formData.subjectLine}
                onChange={(e) => updateField('subjectLine', e.target.value)}
                placeholder="e.g., Quick question about {{companyName}}"
              />
              
              <Input
                label="Preview Text"
                value={formData.previewText || ''}
                onChange={(e) => updateField('previewText', e.target.value)}
                placeholder="Text shown in email preview"
                helperText="The text shown next to the subject in email clients"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => updateField('body', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] font-mono text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use placeholders like {'{{firstName}}'}, {'{{companyName}}'}, {'{{industry}}'} for personalization
                </p>
              </div>
            </div>
          </Card>

          <Card title="Targeting">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Industries</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleIndustry(industry)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedIndustries.includes(industry)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Regions</label>
                <div className="flex flex-wrap gap-2">
                  {REGION_OPTIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedRegions.includes(region)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link href="/templates">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}