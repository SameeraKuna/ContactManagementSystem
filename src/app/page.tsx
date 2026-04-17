'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContacts, getEmailTemplates, Contact, EmailTemplate } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [contactsData, templatesData] = await Promise.all([
          getContacts(),
          getEmailTemplates(),
        ]);
        setContacts(contactsData);
        setTemplates(templatesData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const recentContacts = contacts.slice(0, 5);
  const activeTemplates = templates.filter(t => t.status === 'active');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
        <p className="text-whitemt-1">Welcome to your Contact Management System</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{contacts.length}</div>
          <div className="text-gray-600">Total Contacts</div>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{templates.length}</div>
          <div className="text-gray-600">Email Templates</div>
        </Card>
        <Card className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">{activeTemplates.length}</div>
          <div className="text-gray-600">Active Templates</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Quick Actions">
          <div className="flex flex-col gap-3">
            <Link href="/leads">
              <Button className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Lead
              </Button>
            </Link>
            <Link href="/templates/new">
              <Button variant="secondary" className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Create Email Template
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="ghost" className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                View All Templates
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Contacts */}
        <Card title="Recent Contacts" subtitle={`${contacts.length} total`}>
          {recentContacts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No contacts yet. Add your first lead!</p>
          ) : (
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">{contact.companyName}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    contact.status === 'New' ? 'bg-blue-100 text-blue-700' :
                    contact.status === 'Contacted' ? 'bg-yellow-100 text-yellow-700' :
                    contact.status === 'Qualified' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}