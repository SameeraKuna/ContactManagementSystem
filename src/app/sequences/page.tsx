'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getSequences,
  deleteSequence,
  pauseSequence,
  resumeSequence,
  Sequence,
  SequenceListResponse,
  SEQUENCE_STATUS_OPTIONS,
} from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge, { BadgeVariant } from '@/components/ui/Badge';

export default function SequencesPage() {
  const [data, setData] = useState<SequenceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const response = await getSequences({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setData(response);
      setError('');
    } catch (err) {
      setError('Failed to load sequences');
      console.error(err);
      // Set empty data on error
      setData({
        sequences: [],
        stats: { total: 0, active: 0, totalEnrolled: 0, totalSent: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handleSearch = () => {
    fetchSequences();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sequence? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(id);
      await deleteSequence(id);
      // Refresh the list
      fetchSequences();
    } catch (err) {
      alert('Failed to delete sequence. Only draft sequences can be deleted.');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseResume = async (sequence: Sequence) => {
    try {
      setActionLoading(sequence.id!);
      if (sequence.status === 'active') {
        await pauseSequence(sequence.id!);
      } else if (sequence.status === 'paused') {
        await resumeSequence(sequence.id!);
      }
      // Refresh the list
      fetchSequences();
    } catch (err) {
      alert('Failed to update sequence status');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    const variants: Record<string, BadgeVariant> = {
      draft: 'draft',
      active: 'active',
      paused: 'paused',
      archived: 'archived',
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Sequences</h1>
          <p className="text-gray-600 mt-1">
            Automate your outreach with multi-step email sequences
          </p>
        </div>
        <Link href="/sequences/new">
          <Button>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Sequence
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="!p-4">
            <div className="text-sm font-medium text-gray-500">Total Sequences</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {data.stats.total}
            </div>
          </Card>
          <Card className="!p-4">
            <div className="text-sm font-medium text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {data.stats.active}
            </div>
          </Card>
          <Card className="!p-4">
            <div className="text-sm font-medium text-gray-500">Contacts Enrolled</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {data.stats.totalEnrolled}
            </div>
          </Card>
          <Card className="!p-4">
            <div className="text-sm font-medium text-gray-500">Emails Sent</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {data.stats.totalSent}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search sequences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select
            options={[...SEQUENCE_STATUS_OPTIONS]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Statuses"
          />
          <div></div>
          <Button onClick={handleSearch} variant="secondary">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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

      {/* Sequences List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : !data || data.sequences.length === 0 ? (
        <Card className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sequences yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first automated email sequence to start engaging contacts.
          </p>
          <Link href="/sequences/new">
            <Button>Create Sequence</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.sequences.map((sequence) => (
            <Card key={sequence.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link href={`/sequences/${sequence.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {sequence.name}
                      </h3>
                    </Link>
                    <Badge variant={getStatusBadgeVariant(sequence.status)}>
                      {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Template Info */}
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Template 1:</span>{' '}
                    {sequence.template1?.name || 'Not set'}
                    {sequence.template2Id && (
                      <>
                        <span className="mx-2">→</span>
                        <span className="font-medium">Template 2:</span>{' '}
                        {sequence.template2?.name || 'Not set'}
                      </>
                    )}
                  </div>

                  {/* Timing Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      <span className="font-medium">Delay:</span> {sequence.delayDays} days
                    </span>
                    <span>
                      <span className="font-medium">Send:</span> {formatTime(sequence.sendTime)}
                    </span>
                    <span>
                      <span className="font-medium">Weekdays only:</span>{' '}
                      {sequence.sendWeekdaysOnly ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {/* Stats */}
                  {sequence.stats && (
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-blue-600">
                        {sequence.stats.totalEnrolled} enrolled
                      </span>
                      <span className="text-green-600">
                        {sequence.stats.completed} completed
                      </span>
                      <span className="text-orange-600">
                        {sequence.stats.pending} pending
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/sequences/${sequence.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                  {sequence.status === 'draft' && (
                    <Link href={`/sequences/${sequence.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                  {(sequence.status === 'active' || sequence.status === 'paused') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePauseResume(sequence)}
                      loading={actionLoading === sequence.id}
                    >
                      {sequence.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                  {sequence.status === 'active' && (
                    <Link href={`/sequences/${sequence.id}/enrol`}>
                      <Button size="sm">Enrol</Button>
                    </Link>
                  )}
                  {sequence.status === 'draft' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(sequence.id!)}
                      loading={actionLoading === sequence.id}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}