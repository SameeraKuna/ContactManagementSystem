'use client';

import { useState } from 'react';
import { createContact, Contact, INDUSTRY_OPTIONS, EMPLOYEE_COUNT_OPTIONS } from '../lib/api';

const LEAD_SOURCES = ['Inbound form', 'Outbound reach', 'Referral', 'Event/Webinar', 'Content/Blog', 'Paid ad', 'LinkedIn', 'Other'];

export default function LeadWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Contact>({
    companyName: '',
    website: '',
    city: '',
    country: '',
    employeeCount: '',
    industry: '',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    phone: '',
    leadSource: '',
    notes: '',
  });

  const updateField = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => formData.companyName.trim() !== '';
  const validateStep2 = () => formData.email.trim() !== '';

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      setError('Company name is required');
      return;
    }
    if (step === 2 && !validateStep2()) {
      setError('Email is required');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await createContact(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setFormData({
          companyName: '', website: '', city: '', country: '',
          employeeCount: '', industry: '', firstName: '', lastName: '',
          email: '', jobTitle: '', phone: '', leadSource: '', notes: '',
        });
      }, 1500);
    } catch (err) {
      setError('Failed to save lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='max-w-md mx-auto bg-white p-8 rounded-lg shadow text-center'>
        <div className='text-green-500 text-5xl mb-4'>✓</div>
        <h2 className='text-xl font-semibold'>Lead saved!</h2>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto bg-white p-8 rounded-lg shadow'>
      {/* Progress */}
      <div className='flex justify-center mb-8'>
        {[1, 2, 3].map(s => (
          <div key={s} className='flex items-center'>
            <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + 
              (s <= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500')}>
              {s}
            </div>
            {s < 3 && <div className={'w-8 h-0.5 ' + (s < step ? 'bg-blue-500' : 'bg-gray-200')} />}
          </div>
        ))}
      </div>

      {error && <div className='bg-red-100 text-red-700 p-3 rounded mb-4'>{error}</div>}

      {/* Step 1: Company */}
      {step === 1 && (
        <div>
          <h2 className='text-lg font-semibold mb-4'>Company Information</h2>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Company Name *</label>
              <input type='text' value={formData.companyName} onChange={e => updateField('companyName', e.target.value)}
                className='w-full p-2 border rounded' placeholder='Enter company name' />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Website</label>
              <input type='url' value={formData.website} onChange={e => updateField('website', e.target.value)}
                className='w-full p-2 border rounded' placeholder='https://example.com' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>City</label>
                <input type='text' value={formData.city} onChange={e => updateField('city', e.target.value)}
                  className='w-full p-2 border rounded' />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>Country</label>
                <input type='text' value={formData.country} onChange={e => updateField('country', e.target.value)}
                  className='w-full p-2 border rounded' />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Employee Count</label>
              <select value={formData.employeeCount} onChange={e => updateField('employeeCount', e.target.value)}
                className='w-full p-2 border rounded'>
                <option value=''>Select...</option>
                {EMPLOYEE_COUNT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Industry</label>
              <select value={formData.industry} onChange={e => updateField('industry', e.target.value)}
                className='w-full p-2 border rounded'>
                <option value=''>Select...</option>
                {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contact */}
      {step === 2 && (
        <div>
          <h2 className='text-lg font-semibold mb-4'>Primary Contact</h2>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>First Name</label>
                <input type='text' value={formData.firstName} onChange={e => updateField('firstName', e.target.value)}
                  className='w-full p-2 border rounded' />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>Last Name</label>
                <input type='text' value={formData.lastName} onChange={e => updateField('lastName', e.target.value)}
                  className='w-full p-2 border rounded' />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Email *</label>
              <input type='email' value={formData.email} onChange={e => updateField('email', e.target.value)}
                className='w-full p-2 border rounded' placeholder='email@example.com' />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Job Title</label>
              <input type='text' value={formData.jobTitle} onChange={e => updateField('jobTitle', e.target.value)}
                className='w-full p-2 border rounded' />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Phone</label>
              <input type='tel' value={formData.phone} onChange={e => updateField('phone', e.target.value)}
                className='w-full p-2 border rounded' />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Source */}
      {step === 3 && (
        <div>
          <h2 className='text-lg font-semibold mb-4'>Source & Notes</h2>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Lead Source</label>
              <select value={formData.leadSource} onChange={e => updateField('leadSource', e.target.value)}
                className='w-full p-2 border rounded'>
                <option value=''>Select...</option>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Notes</label>
              <textarea value={formData.notes} onChange={e => updateField('notes', e.target.value)}
                className='w-full p-2 border rounded h-32' placeholder='Add any relevant notes...' />
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className='flex justify-between mt-8'>
        {step > 1 ? (
          <button onClick={handleBack} className='px-4 py-2 border rounded hover:bg-gray-50'>Back</button>
        ) : <div />}
        {step < 3 ? (
          <button onClick={handleNext} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>Next</button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'>
            {loading ? 'Saving...' : 'Save Lead'}
          </button>
        )}
      </div>
    </div>
  );
}
