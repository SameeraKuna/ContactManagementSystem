'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCompanies,
  getIndustries,
  getEmailTemplates,
  getCompanyContacts,
  createSchedule,
  CompanyWithContacts,
  EmailTemplate,
  SCHEDULE_RECURRENCE_OPTIONS,
  SCHEDULE_SEQUENCE_TYPE_OPTIONS,
} from '@/lib/api';

// Step indicators
const STEPS = [
  { number: 1, title: 'Basic Info', description: 'Name and settings' },
  { number: 2, title: 'Select Companies', description: 'Choose target companies' },
  { number: 3, title: 'Select Template', description: 'Pick email template' },
  { number: 4, title: 'Set Timing', description: 'Configure send times' },
  { number: 5, title: 'Review', description: 'Confirm and create' },
];

interface CountryTiming {
  countryName: string;
  timezone: string;
  sendTime: string;
  weekdaysOnly: boolean;
  contactCount: number;
}

export default function NewSchedulePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [sequenceType, setSequenceType] = useState('first_only');
  const [recurrence, setRecurrence] = useState('once');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 2: Companies
  const [companies, setCompanies] = useState<CompanyWithContacts[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [industryFilter, setIndustryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Step 3: Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Step 4: Country Timings
  const [countryTimings, setCountryTimings] = useState<CountryTiming[]>([]);

  // Load initial data
  useEffect(() => {
    loadCompanies();
    loadIndustries();
    loadTemplates();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies({
        industry: industryFilter || undefined,
        search: searchFilter || undefined,
      });
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const loadIndustries = async () => {
    try {
      const data = await getIndustries();
      setIndustries(data);
    } catch (err) {
      console.error('Failed to load industries:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await getEmailTemplates();
      setTemplates(data.filter(t => t.status === 'published' || t.status === 'active'));
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  // When companies selection changes, update country timings
  useEffect(() => {
    if (selectedCompanies.length > 0 && currentStep >= 4) {
      loadCountryTimings();
    }
  }, [selectedCompanies, currentStep]);

  const loadCountryTimings = async () => {
    try {
      const data = await getCompanyContacts(selectedCompanies);
      const timings: CountryTiming[] = data.countryBreakdown.map(cb => ({
        countryName: cb.country,
        timezone: cb.timezone,
        sendTime: '09:00',
        weekdaysOnly: true,
        contactCount: cb.contactCount,
      }));
      setCountryTimings(timings);
    } catch (err) {
      console.error('Failed to load country timings:', err);
    }
  };

  // Filter companies when filters change
  useEffect(() => {
    loadCompanies();
  }, [industryFilter, searchFilter]);

  const toggleCompany = (companyName: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyName)
        ? prev.filter(c => c !== companyName)
        : [...prev, companyName]
    );
  };

  const selectAllCompanies = () => {
    setSelectedCompanies(companies.map(c => c.companyName));
  };

  const clearAllCompanies = () => {
    setSelectedCompanies([]);
  };

  const updateCountryTiming = (index: number, field: keyof CountryTiming, value: string | boolean) => {
    setCountryTimings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return name.trim() !== '' && startDate !== '';
      case 2:
        return selectedCompanies.length > 0;
      case 3:
        return selectedTemplateId !== '';
      case 4:
        return countryTimings.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createSchedule({
        name,
        sequenceType,
        recurrence,
        startDate,
        endDate: endDate || undefined,
        companyNames: selectedCompanies,
        templateAssignments: [{ templateId: selectedTemplateId, sequencePosition: 'first' }],
        countryTimings: countryTimings.map(ct => ({
          countryName: ct.countryName,
          timezone: ct.timezone,
          sendTime: ct.sendTime,
          weekdaysOnly: ct.weekdaysOnly,
        })),
      });
      router.push('/schedules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const totalContacts = countryTimings.reduce((sum, ct) => sum + ct.contactCount, 0);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/schedules" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Schedules
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Schedule</h1>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q1 Outreach - Tech Companies"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sequence Type</label>
                <select
                  value={sequenceType}
                  onChange={(e) => setSequenceType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SCHEDULE_SEQUENCE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SCHEDULE_RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Companies */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Companies</h2>
              
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">All Industries</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Selection Actions */}
              <div className="flex gap-2 mb-4">
                <button onClick={selectAllCompanies} className="text-blue-600 hover:text-blue-800 text-sm">
                  Select All ({companies.length})
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={clearAllCompanies} className="text-blue-600 hover:text-blue-800 text-sm">
                  Clear All
                </button>
                <span className="ml-auto text-gray-600">
                  {selectedCompanies.length} selected
                </span>
              </div>

              {/* Company List */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {companies.map(company => (
                  <label
                    key={company.companyName}
                    className={`flex items-center p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                      selectedCompanies.includes(company.companyName) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(company.companyName)}
                      onChange={() => toggleCompany(company.companyName)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{company.companyName}</div>
                      <div className="text-sm text-gray-500">
                        {company.contactCount} contacts • {company.industry || 'No industry'} • {company.countries?.join(', ') || 'No country'}
                      </div>
                    </div>
                  </label>
                ))}
                {companies.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No companies found</div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Select Template */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Email Template</h2>
              
              <div className="space-y-3">
                {templates.map(template => (
                  <label
                    key={template.id}
                    className={`block p-4 border rounded-lg cursor-pointer hover:border-blue-300 ${
                      selectedTemplateId === template.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="template"
                        checked={selectedTemplateId === template.id}
                        onChange={() => setSelectedTemplateId(template.id || '')}
                        className="mt-1 mr-3 h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600 mt-1">Subject: {template.subjectLine}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Position: {template.sequencePosition} • Industries: {template.industries?.join(', ') || 'All'}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
                {templates.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No published templates found. <Link href="/templates/new" className="text-blue-600">Create one</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Set Timing */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Configure Send Times by Country</h2>
              <p className="text-gray-600 mb-6">Set optimal send times for each country based on their local timezone.</p>
              
              <div className="space-y-4">
                {countryTimings.map((timing, index) => (
                  <div key={timing.countryName} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium">{timing.countryName}</span>
                        <span className="text-sm text-gray-500 ml-2">({timing.timezone})</span>
                      </div>
                      <span className="text-sm text-gray-600">{timing.contactCount} contacts</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Send Time (Local)</label>
                        <input
                          type="time"
                          value={timing.sendTime}
                          onChange={(e) => updateCountryTiming(index, 'sendTime', e.target.value)}
                          className="px-3 py-2 border rounded"
                        />
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={timing.weekdaysOnly}
                          onChange={(e) => updateCountryTiming(index, 'weekdaysOnly', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">Weekdays only</span>
                      </label>
                    </div>
                  </div>
                ))}
                {countryTimings.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No country data available. Make sure companies are selected.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review & Confirm</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Schedule Details</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-500">Name:</dt>
                    <dd className="font-medium">{name}</dd>
                    <dt className="text-gray-500">Sequence Type:</dt>
                    <dd>{SCHEDULE_SEQUENCE_TYPE_OPTIONS.find(o => o.value === sequenceType)?.label}</dd>
                    <dt className="text-gray-500">Recurrence:</dt>
                    <dd>{SCHEDULE_RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label}</dd>
                    <dt className="text-gray-500">Start Date:</dt>
                    <dd>{startDate}</dd>
                    {endDate && (
                      <>
                        <dt className="text-gray-500">End Date:</dt>
                        <dd>{endDate}</dd>
                      </>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Target Audience</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-500">Companies:</dt>
                    <dd className="font-medium">{selectedCompanies.length} selected</dd>
                    <dt className="text-gray-500">Total Contacts:</dt>
                    <dd className="font-medium">{totalContacts}</dd>
                    <dt className="text-gray-500">Countries:</dt>
                    <dd>{countryTimings.length}</dd>
                  </dl>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Email Template</h3>
                  {selectedTemplate && (
                    <dl className="text-sm">
                      <dt className="text-gray-500">Template:</dt>
                      <dd className="font-medium">{selectedTemplate.name}</dd>
                      <dt className="text-gray-500 mt-1">Subject:</dt>
                      <dd>{selectedTemplate.subjectLine}</dd>
                    </dl>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Send Times</h3>
                  <div className="text-sm space-y-1">
                    {countryTimings.slice(0, 5).map(ct => (
                      <div key={ct.countryName} className="flex justify-between">
                        <span>{ct.countryName}</span>
                        <span className="text-gray-600">{ct.sendTime} ({ct.timezone})</span>
                      </div>
                    ))}
                    {countryTimings.length > 5 && (
                      <div className="text-gray-500">...and {countryTimings.length - 5} more countries</div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The schedule will be created in draft status. You can review and activate it from the schedules list.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-300 text-white cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}