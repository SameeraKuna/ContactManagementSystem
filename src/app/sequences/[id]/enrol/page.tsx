'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getSequence,
  getEnrollableContacts,
  enrolContacts,
  Sequence,
  Contact,
  INDUSTRY_OPTIONS,
} from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import ChipFilter from '@/components/ui/ChipFilter';
import SidebarSummary from '@/components/ui/SidebarSummary';

export default function EnrolContactsPage() {
  const params = useParams();
  const router = useRouter();
  const sequenceId = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sequenceData, contactsData] = await Promise.all([
        getSequence(sequenceId),
        getEnrollableContacts(sequenceId, {
          search: searchTerm || undefined,
          industry: industryFilter.length > 0 ? industryFilter.join(',') : undefined,
        }),
      ]);
      setSequence(sequenceData);
      setContacts(contactsData);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sequenceId) {
      fetchData();
    }
  }, [sequenceId]);

  const handleSearch = () => {
    fetchData();
  };

  const handleSelectAll = () => {
    if (selectedContactIds.size === contacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(contacts.map((c) => c.id!)));
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleEnrol = async () => {
    if (selectedContactIds.size === 0) {
      alert('Please select at least one contact');
      return;
    }

    try {
      setEnrolling(true);
      const result = await enrolContacts(sequenceId, Array.from(selectedContactIds));
      
      if (result.skipped > 0) {
        alert(`Enrolled ${result.enrolled} contacts. ${result.skipped} were skipped (already enrolled, unsubscribed, or bounced).`);
      } else {
        alert(`Successfully enrolled ${result.enrolled} contacts`);
      }
      
      router.push(`/sequences/${sequenceId}`);
    } catch (err) {
      alert('Failed to enrol contacts. Please try again.');
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const summaryItems = [
    { label: 'Sequence', value: sequence?.name || '—' },
    { label: 'Available contacts', value: contacts.length },
    { label: 'Selected', value: selectedContactIds.size },
  ];

  const checklist = [
    { label: 'Sequence is active', completed: sequence?.status === 'active' },
    { label: 'Contacts selected', completed: selectedContactIds.size > 0 },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !sequence) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Sequence not found'}</p>
          <Link href="/sequences">
            <Button variant="secondary">Back to Sequences</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (sequence.status !== 'active') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="text-center py-12">
          <p className="text-yellow-600 mb-4">
            Only active sequences can have contacts enrolled.
          </p>
          <Link href={`/sequences/${sequenceId}`}>
            <Button variant="secondary">Back to Sequence</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/sequences/${sequenceId}`}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {sequence.name}
          </Link>
          <span className="text-gray-400">/</span>
          <h1 className="text-xl font-semibold text-gray-900">Enrol Contacts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/sequences/${sequenceId}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnrol}
            loading={enrolling}
            disabled={selectedContactIds.size === 0}
          >
            Enrol {selectedContactIds.size > 0 ? `(${selectedContactIds.size})` : ''}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Selection */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              SELECT CONTACTS TO ENROL
            </h2>

            {/* Filters */}
            <div className="space-y-4 mb-6">
              <ChipFilter
                label="Filter by industry"
                options={[...INDUSTRY_OPTIONS]}
                selected={industryFilter}
                onChange={setIndustryFilter}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div></div>
                <Button variant="secondary" onClick={handleSearch}>
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4 text-sm">
              <span>
                <strong>Matching:</strong> {contacts.length}
              </span>
              <span>
                <strong>Selected:</strong> {selectedContactIds.size}
              </span>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center gap-3 mb-4">
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                {selectedContactIds.size === contacts.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedContactIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContactIds(new Set())}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Contact List */}
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No eligible contacts found. Contacts who are already enrolled,
                  unsubscribed, or bounced are excluded.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={selectedContactIds.size === contacts.length && contacts.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Industry
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Country
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedContactIds.has(contact.id!) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectContact(contact.id!)}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedContactIds.has(contact.id!)}
                            onChange={() => handleSelectContact(contact.id!)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {contact.companyName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {contact.industry || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {contact.country || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selection Summary */}
            {selectedContactIds.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedContactIds.size} contacts selected</strong> will be enrolled
                  into the sequence &ldquo;{sequence.name}&rdquo;
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            <SidebarSummary
              title="Enrolment Summary"
              items={summaryItems}
              checklist={checklist}
              checklistTitle="Requirements"
            />

            {/* Exclusion Info */}
            <Card className="!p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Auto-Excluded Contacts
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                The following contacts are automatically excluded:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Already enrolled in this sequence
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Unsubscribed contacts
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Bounced contacts
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Contacts without email
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}