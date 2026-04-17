'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createSequence,
  activateSequence,
  getEmailTemplates,
  EmailTemplate,
  Sequence,
  DELAY_DAYS_OPTIONS,
} from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import TimeSelect from '@/components/ui/TimeSelect';
import StepIndicator from '@/components/ui/StepIndicator';
import SidebarSummary from '@/components/ui/SidebarSummary';
import Badge from '@/components/ui/Badge';

interface FormData {
  name: string;
  template1Id: string;
  template2Id: string;
  delayDays: number;
  sendTime: string;
  sendWeekdaysOnly: boolean;
}

interface FormErrors {
  name?: string;
  template1Id?: string;
  template2Id?: string;
  delayDays?: string;
  sendTime?: string;
}

const STEPS = [
  { label: 'Details' },
  { label: 'Templates' },
  { label: 'Timing' },
  { label: 'Review' },
];

export default function NewSequencePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [firstTemplates, setFirstTemplates] = useState<EmailTemplate[]>([]);
  const [secondTemplates, setSecondTemplates] = useState<EmailTemplate[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    template1Id: '',
    template2Id: '',
    delayDays: 3,
    sendTime: '09:00',
    sendWeekdaysOnly: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const [first, second] = await Promise.all([
          getEmailTemplates({ sequence: 'first' }),
          getEmailTemplates({ sequence: 'second' }),
        ]);
        setFirstTemplates(first);
        setSecondTemplates(second);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const selectedTemplate1 = firstTemplates.find((t) => t.id === formData.template1Id);
  const selectedTemplate2 = secondTemplates.find((t) => t.id === formData.template2Id);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Sequence name is required';
      } else if (formData.name.length < 3) {
        newErrors.name = 'Name must be at least 3 characters';
      } else if (formData.name.length > 100) {
        newErrors.name = 'Name must be less than 100 characters';
      }
    }

    if (step === 1) {
      if (!formData.template1Id) {
        newErrors.template1Id = 'First email template is required';
      }
      if (formData.template2Id && formData.template2Id === formData.template1Id) {
        newErrors.template2Id = 'Second template must be different from first';
      }
    }

    if (step === 2) {
      if (!formData.sendTime) {
        newErrors.sendTime = 'Send time is required';
      }
      if (formData.template2Id && (!formData.delayDays || formData.delayDays < 1)) {
        newErrors.delayDays = 'Delay must be at least 1 day';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (step: number) => {
    // Only allow going back or to current step
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      return;
    }

    try {
      setLoading(true);
      await createSequence({
        name: formData.name,
        template1Id: formData.template1Id,
        template2Id: formData.template2Id || undefined,
        delayDays: formData.delayDays,
        sendTime: formData.sendTime,
        sendWeekdaysOnly: formData.sendWeekdaysOnly,
        status: 'draft',
      });
      router.push('/sequences');
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert('Failed to save sequence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return;
    }

    try {
      setLoading(true);
      const sequence = await createSequence({
        name: formData.name,
        template1Id: formData.template1Id,
        template2Id: formData.template2Id || undefined,
        delayDays: formData.delayDays,
        sendTime: formData.sendTime,
        sendWeekdaysOnly: formData.sendWeekdaysOnly,
        status: 'draft',
      });
      await activateSequence(sequence.id!);
      router.push('/sequences');
    } catch (err) {
      console.error('Failed to activate sequence:', err);
      alert('Failed to activate sequence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const summaryItems = [
    { label: 'Name', value: formData.name || '—' },
    { label: 'Template 1', value: selectedTemplate1?.name || '—' },
    { label: 'Template 2', value: selectedTemplate2?.name || 'None' },
    { label: 'Delay', value: formData.template2Id ? `${formData.delayDays} days` : 'N/A' },
    { label: 'Send time', value: formatTime(formData.sendTime) },
    { label: 'Weekdays only', value: formData.sendWeekdaysOnly ? 'Yes' : 'No' },
  ];

  const checklist = [
    { label: 'Sequence name', completed: !!formData.name.trim() },
    { label: 'Template 1 selected', completed: !!formData.template1Id },
    { label: 'Timing configured', completed: !!formData.sendTime },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sequences"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Sequences
          </Link>
          <span className="text-gray-400">/</span>
          <h1 className="text-xl font-semibold text-gray-900">New sequence</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            loading={loading}
            disabled={!formData.name || !formData.template1Id}
          >
            Save draft
          </Button>
          <Button
            onClick={handleActivate}
            loading={loading}
            disabled={currentStep < STEPS.length - 1}
          >
            Activate sequence
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator
          steps={STEPS.map((step, index) => ({
            ...step,
            completed: index < currentStep,
          }))}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          {/* Step 1: Details */}
          {currentStep === 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                STEP 1 — SEQUENCE DETAILS
              </h2>
              <div className="space-y-4">
                <Input
                  label="Sequence name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  placeholder="e.g., SaaS Europe Q2 Outreach"
                />
                <p className="text-sm text-gray-500">
                  Give your sequence a descriptive name for easy identification
                </p>
              </div>
            </Card>
          )}

          {/* Step 2: Templates */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  STEP 2 — SELECT TEMPLATES
                </h2>

                {templatesLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Template 1 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TEMPLATE 1 (Required) — First email in sequence
                      </label>
                      <Select
                        options={firstTemplates.map((t) => ({
                          value: t.id!,
                          label: `${t.name} — ${t.subjectLine}`,
                        }))}
                        value={formData.template1Id}
                        onChange={(e) =>
                          setFormData({ ...formData, template1Id: e.target.value })
                        }
                        placeholder="Select first email template..."
                        error={errors.template1Id}
                      />
                      {selectedTemplate1 && (
                        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="success">Selected</Badge>
                            <span className="font-medium text-green-800">
                              {selectedTemplate1.name}
                            </span>
                          </div>
                          <p className="text-sm text-green-700">
                            Subject: {selectedTemplate1.subjectLine}
                          </p>
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* Template 2 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TEMPLATE 2 (Optional) — Follow-up email
                      </label>
                      <Select
                        options={secondTemplates.map((t) => ({
                          value: t.id!,
                          label: `${t.name} — ${t.subjectLine}`,
                        }))}
                        value={formData.template2Id}
                        onChange={(e) =>
                          setFormData({ ...formData, template2Id: e.target.value })
                        }
                        placeholder="Select second email template (optional)..."
                        error={errors.template2Id}
                      />
                      {selectedTemplate2 && (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info">Selected</Badge>
                            <span className="font-medium text-blue-800">
                              {selectedTemplate2.name}
                            </span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Subject: {selectedTemplate2.subjectLine}
                          </p>
                        </div>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        ℹ️ Only templates marked as &quot;2nd email&quot; will be shown here
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Step 3: Timing */}
          {currentStep === 2 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                STEP 3 — SEND TIMING
              </h2>

              <div className="space-y-6">
                {/* Delay between emails */}
                {formData.template2Id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay between emails
                    </label>
                    <Select
                      options={DELAY_DAYS_OPTIONS}
                      value={formData.delayDays.toString()}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          delayDays: parseInt(e.target.value) || 3,
                        })
                      }
                      error={errors.delayDays}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Days between sending the 1st and 2nd email
                    </p>
                  </div>
                )}

                {!formData.template2Id && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      ℹ️ Delay setting only applies when Template 2 is selected
                    </p>
                  </div>
                )}

                <hr className="border-gray-200" />

                {/* Send time */}
                <div>
                  <TimeSelect
                    label="Send time (contact's local time)"
                    required
                    value={formData.sendTime}
                    onChange={(e) =>
                      setFormData({ ...formData, sendTime: e.target.value })
                    }
                    error={errors.sendTime}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Emails will be sent at this time in each contact&apos;s timezone
                  </p>
                </div>

                <hr className="border-gray-200" />

                {/* Weekdays only */}
                <div>
                  <Checkbox
                    label="Send on weekdays only"
                    description="If a send falls on weekend, it will be moved to Monday"
                    checked={formData.sendWeekdaysOnly}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sendWeekdaysOnly: e.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                STEP 4 — REVIEW & ACTIVATE
              </h2>

              <div className="space-y-6">
                {/* Sequence Configuration */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">
                    SEQUENCE CONFIGURATION
                  </h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium text-gray-900">{formData.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status</dt>
                      <dd>
                        <Badge variant="draft">Draft</Badge>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Email Sequence Visual */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">EMAIL SEQUENCE</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center">
                        <span className="text-blue-700 font-medium">Email 1</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-2 text-center max-w-[100px] truncate">
                        {selectedTemplate1?.name || 'Not set'}
                      </span>
                    </div>

                    {formData.template2Id && (
                      <>
                        <div className="flex flex-col items-center">
                          <div className="text-gray-400 text-sm">
                            {formData.delayDays} days
                          </div>
                          <div className="w-16 h-0.5 bg-gray-300"></div>
                          <div className="text-gray-400">→</div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
                            <span className="text-green-700 font-medium">Email 2</span>
                          </div>
                          <span className="text-xs text-gray-500 mt-2 text-center max-w-[100px] truncate">
                            {selectedTemplate2?.name || 'Not set'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Timing Rules */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">TIMING RULES</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Send time: {formatTime(formData.sendTime)} (contact&apos;s local time)</li>
                    <li>• Weekdays only: {formData.sendWeekdaysOnly ? 'Yes' : 'No'}</li>
                    {formData.sendWeekdaysOnly && (
                      <li>• If weekend: Moves to Monday</li>
                    )}
                  </ul>
                </div>

                {/* Warning */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Sequence is in <strong>DRAFT</strong>. Activate to start
                    enrolling contacts.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              ← Back
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext}>Next →</Button>
            ) : (
              <Button onClick={handleActivate} loading={loading}>
                Activate Sequence
              </Button>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <SidebarSummary
              title="Sequence Summary"
              items={summaryItems}
              checklist={checklist}
              checklistTitle="Checklist"
            />
          </div>
        </div>
      </div>
    </div>
  );
}