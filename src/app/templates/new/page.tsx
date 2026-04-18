'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEmailTemplate, EmailTemplate, INDUSTRY_OPTIONS, REGION_OPTIONS, SEQUENCE_POSITION_OPTIONS, TEMPLATE_STATUS_OPTIONS } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    subjectLine: '',
    previewText: '',
    body: '',
    sequencePosition: 'first',
    industries: [] as string[],
    regions: [] as string[],
    status: 'draft',
  });

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleIndustry = (industry: string) => {
    const updated = selectedIndustries.includes(industry)
      ? selectedIndustries.filter(i => i !== industry)
      : [...selectedIndustries, industry];
    setSelectedIndustries(updated);
    setFormData(prev => ({ ...prev, industries: updated }));
  };

  const toggleRegion = (region: string) => {
    const updated = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    setSelectedRegions(updated);
    setFormData(prev => ({ ...prev, regions: updated }));
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
      setLoading(true);
      await createEmailTemplate(formData);
      router.push('/templates');
    } catch (err) {
      setError('Failed to create template. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/templates" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-blue-600">Create New Template</h1>
        <p className="text-white-600 mt-1">Create a new email template for your outreach campaigns</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
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
                  value={formData.sequencePosition}
                  onChange={(e) => updateField('sequencePosition', e.target.value)}
                />
                <Select
                  label="Status"
                  options={[...TEMPLATE_STATUS_OPTIONS]}
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Email Content */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] font-mono text-sm"
                  placeholder={`Hi {{firstName}},

I noticed that {{companyName}} is growing rapidly in the {{industry}} space...

Best regards,
Your Name`}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use placeholders like {'{{firstName}}'}, {'{{companyName}}'}, {'{{industry}}'} for personalization
                </p>
              </div>
            </div>
          </Card>

          {/* Targeting */}
          <Card title="Targeting">
            <div className="space-y-6">
              <div>
                <label className="block text-base font-medium text-blue-600 mb-3">Industries</label>
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
                <p className="mt-2 text-sm text-gray-500">Select industries this template is designed for</p>
              </div>

              <div>
                <label className="block text-base font-medium text-blue-600 mb-3">Regions</label>
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
                <p className="mt-2 text-sm text-gray-500">Select regions this template is designed for</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/templates">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" loading={loading}>
              Create Template
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}