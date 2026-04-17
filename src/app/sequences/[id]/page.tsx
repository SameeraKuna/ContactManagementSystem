'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getSequence,
  getSequenceEnrolments,
  activateSequence,
  pauseSequence,
  resumeSequence,
  removeEnrolment,
  Sequence,
  SequenceEnrolment,
} from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function SequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sequenceId = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [enrolments, setEnrolments] = useState<SequenceEnrolment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Enrolment filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const [sequenceData, enrolmentsData] = await Promise.all([
      getSequence(sequenceId),
      getSequenceEnrolments(sequenceId, {
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
    ]);
      setSequence(sequenceData);
      setEnrolments(enrolmentsData);
      setError('');
    } catch (err) {
      setError('Failed to load sequence details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sequenceId, searchTerm, statusFilter]);

  useEffect(() => {
    if (sequenceId) fetchData();
  }, [fetchData]);

  const handleStatusChange = async (action: 'activate' | 'pause' | 'resume') => {
    try {
      setActionLoading(true);
      if (action === 'activate') {
        await activateSequence(sequenceId);
      } else if (action === 'pause') {
        await pauseSequence(sequenceId);
      } else if (action === 'resume') {
        await resumeSequence(sequenceId);
      }
      await fetchData();
    } catch (err) {
      alert(`Failed to ${action} sequence`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveEnrolment = async (enrolmentId: string) => {
    if (!confirm('Remove this contact from the sequence?')) return;

    try {
      await removeEnrolment(sequenceId, enrolmentId);
      fetchData();
    } catch (err) {
      alert('Failed to remove contact');
      console.error(err);
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    const variants: Record<string, BadgeVariant> = {
      draft: 'draft',
      active: 'active',
      paused: 'paused',
      archived: 'archived',
      pending: 'pending',
      in_progress: 'info',
      completed: 'completed',
      unsubscribed: 'warning',
      bounced: 'error',
    };
    return variants[status] || 'info';
  };

  const formatTime = (time: string) => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sequences"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Sequences
          </Link>
          <span className="text-gray-400">/</span>
          <h1 className="text-xl font-semibold text-gray-900">{sequence.name}</h1>
          <Badge variant={getStatusBadgeVariant(sequence.status)} size="md">
            {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {sequence.status === 'draft' && (
            <>
              <Link href={`/sequences/${sequenceId}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button onClick={() => handleStatusChange('activate')} loading={actionLoading}>
                Activate
              </Button>
            </>
          )}
          {sequence.status === 'active' && (
            <>
              <Link href={`/sequences/${sequenceId}/enrol`}>
                <Button variant="secondary">Enrol Contacts</Button>
              </Link>
              <Button variant="warning" onClick={() => handleStatusChange('pause')} loading={actionLoading}>
                Pause
              </Button>
            </>
          )}
          {sequence.status === 'paused' && (
            <Button onClick={() => handleStatusChange('resume')} loading={actionLoading}>
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Sequence Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sequence Overview</h2>
          
          {/* Email Flow Visual */}
          <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg mb-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 border-2 border-blue-300 rounded-lg flex flex-col items-center justify-center">
                <span className="text-blue-700 font-medium text-sm">Email 1</span>
                <span className="text-xs text-blue-600 mt-1">Day 0</span>
              </div>
              <span className="text-xs text-gray-500 mt-2 text-center max-w-[120px] truncate">
                {sequence.template1?.name || 'Not set'}
              </span>
            </div>

            {sequence.template2Id && (
              <>
                <div className="flex flex-col items-center">
                  <div className="text-gray-400 text-sm font-medium">{sequence.delayDays} days</div>
                  <div className="w-20 h-0.5 bg-gray-300 my-1"></div>
                  <div className="text-gray-400 text-2xl">→</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-green-100 border-2 border-green-300 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-green-700 font-medium text-sm">Email 2</span>
                    <span className="text-xs text-green-600 mt-1">Day {sequence.delayDays}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 text-center max-w-[120px] truncate">
                    {sequence.template2?.name || 'Not set'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Send Time</dt>
              <dd className="font-medium text-gray-900">{formatTime(sequence.sendTime)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Weekdays Only</dt>
              <dd className="font-medium text-gray-900">{sequence.sendWeekdaysOnly ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium text-gray-900">{formatDate(sequence.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Updated</dt>
              <dd className="font-medium text-gray-900">{formatDate(sequence.updatedAt)}</dd>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-gray-500">Total Enrolled</dt>
              <dd className="font-semibold text-gray-900">{sequence.stats?.totalEnrolled || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Pending</dt>
              <dd className="font-semibold text-blue-600">{sequence.stats?.pending || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">In Progress</dt>
              <dd className="font-semibold text-orange-600">{sequence.stats?.inProgress || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Completed</dt>
              <dd className="font-semibold text-green-600">{sequence.stats?.completed || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Unsubscribed</dt>
              <dd className="font-semibold text-yellow-600">{sequence.stats?.unsubscribed || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Bounced</dt>
              <dd className="font-semibold text-red-600">{sequence.stats?.bounced || 0}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Enrolments Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Enrolled Contacts</h2>
          {sequence.status === 'active' && (
            <Link href={`/sequences/${sequenceId}/enrol`}>
              <Button size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Enrol
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
          <Select
            options={['pending', 'in_progress', 'completed', 'unsubscribed', 'bounced', 'paused']}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Statuses"
          />
          <Button variant="secondary" onClick={fetchData}>
            Apply Filters
          </Button>
        </div>

        {/* Table */}
        {enrolments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No contacts enrolled yet</p>
            {sequence.status === 'active' && (
              <Link href={`/sequences/${sequenceId}/enrol`}>
                <Button>Enrol Contacts</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Step</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Send</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrolments.map((enrolment) => (
                  <tr key={enrolment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {enrolment.contact?.firstName} {enrolment.contact?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{enrolment.contact?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">Step {enrolment.currentStep}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(enrolment.status)}>
                        {enrolment.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(enrolment.nextSendAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(enrolment.enrolledAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {enrolment.status === 'pending' || enrolment.status === 'in_progress' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEnrolment(enrolment.id!)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}