'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getEmailTemplates, deleteEmailTemplate, cloneEmailTemplate, EmailTemplate, INDUSTRY_OPTIONS, SEQUENCE_POSITION_OPTIONS } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sequenceFilter, setSequenceFilter] = useState('');

const fetchTemplates = useCallback(async () => {
  try {
    setLoading(true);

    const params: {
      search?: string;
      industry?: string;
      sequence?: string;
    } = {};

    if (search) params.search = search;
    if (industryFilter) params.industry = industryFilter;
    if (sequenceFilter) params.sequence = sequenceFilter;

    const data = await getEmailTemplates(params);

    setTemplates(data);
    setError('');
  } catch (err) {
    setError('Failed to load templates');
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [search, industryFilter, sequenceFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSearch = () => {
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      setActionLoading(id);
      await deleteEmailTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete template');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClone = async (id: string) => {
    try {
      setActionLoading(`clone-${id}`);
      const cloned = await cloneEmailTemplate(id);
      setTemplates([cloned, ...templates]);
    } catch (err) {
      alert('Failed to clone template');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-gray-100 text-gray-700',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-700';
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Email Templates</h1>
          <p className="text-gray-600 mt-1">Manage your email templates for outreach campaigns</p>
        </div>
        <Link href="/templates/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select
            options={[...INDUSTRY_OPTIONS]}
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            placeholder="All Industries"
          />
          <Select
            options={[...SEQUENCE_POSITION_OPTIONS]}
            value={sequenceFilter}
            onChange={(e) => setSequenceFilter(e.target.value)}
            placeholder="All Sequences"
          />
          <Button onClick={handleSearch} variant="secondary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first email template.</p>
          <Link href="/templates/new">
            <Button>Create Template</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(template.status)}`}>
                      {template.status}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {template.sequencePosition}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Subject:</span> {template.subjectLine}
                  </p>
                  {template.previewText && (
                    <p className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Preview:</span> {template.previewText}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Created: {new Date(template.createdAt || '').toLocaleDateString()}</span>
                  {Array.isArray(template.industries) && template.industries.length > 0 && (
  <span>Industries: {template.industries.join(', ')}</span>
)}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/templates/${template.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClone(template.id!)}
                    loading={actionLoading === `clone-${template.id}`}
                  >
                    Clone
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(template.id!)}
                    loading={actionLoading === template.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}