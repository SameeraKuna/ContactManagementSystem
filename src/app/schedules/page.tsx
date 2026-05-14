'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getSchedules,
  deleteSchedule,
  activateSchedule,
  pauseSchedule,
  ScheduleListItem,
} from '@/lib/api';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try {
      await activateSchedule(id);
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate schedule');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await pauseSchedule(id);
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause schedule');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    setActionLoading(id);
    try {
      await deleteSchedule(id);
      await loadSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case 'weekly':
        return 'Weekly';
      case 'biweekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'once':
      default:
        return 'One Time';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedules</h1>
            <p className="text-gray-600 mt-1">Manage your email sending schedules</p>
          </div>
          <Link
            href="/schedules/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Create Schedule
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Schedules List */}
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Schedules Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first schedule to start sending emails to your contacts.
            </p>
            <Link
              href="/schedules/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Schedule
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurrence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Companies
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{schedule.name}</div>
                      {schedule.templateName && (
                        <div className="text-sm text-gray-500">Template: {schedule.templateName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getRecurrenceLabel(schedule.recurrence)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {schedule.totalCompanies}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {schedule.totalContacts}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {schedule.startDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {schedule.nextRunDate || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {schedule.status === 'draft' && (
                          <button
                            onClick={() => handleActivate(schedule.id)}
                            disabled={actionLoading === schedule.id}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        {schedule.status === 'active' && (
                          <button
                            onClick={() => handlePause(schedule.id)}
                            disabled={actionLoading === schedule.id}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                          >
                            Pause
                          </button>
                        )}
                        {schedule.status === 'paused' && (
                          <button
                            onClick={() => handleActivate(schedule.id)}
                            disabled={actionLoading === schedule.id}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            Resume
                          </button>
                        )}
                        {(schedule.status === 'draft' || schedule.status === 'paused') && (
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            disabled={actionLoading === schedule.id}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {schedules.length > 0 && (
          <div className="mt-8 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{schedules.length}</div>
              <div className="text-sm text-gray-600">Total Schedules</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {schedules.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {schedules.filter(s => s.status === 'paused').length}
              </div>
              <div className="text-sm text-gray-600">Paused</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-600">
                {schedules.filter(s => s.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Draft</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}