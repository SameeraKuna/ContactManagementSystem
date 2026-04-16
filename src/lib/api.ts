// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// TypeScript Interfaces
export interface Contact {
  id?: string;
  companyName: string;
  website?: string;
  city?: string;
  country?: string;
  employeeCount?: string;
  industry?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  jobTitle?: string;
  phone?: string;
  leadSource?: string;
  notes?: string;
  status?: string;
  unsubscribedAt?: string;
  createdAt?: string;
}

export interface EmailTemplate {
  id?: string;
  name: string;
  subjectLine: string;
  previewText?: string;
  body: string;
  sequencePosition?: string;
  industries?: string;
  regions?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactFilters {
  [key: string]: string | undefined;
  industry?: string;
  status?: string;
  search?: string;
}

export interface EmailTemplateFilters {
  [key: string]: string | undefined;
  industry?: string;
  region?: string;
  sequence?: string;
  search?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If parsing fails, use the default error message
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Build query string from filters
function buildQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================
// CONTACTS API
// ============================================

/**
 * Get all contacts with optional filters
 */
export async function getContacts(filters?: ContactFilters): Promise<Contact[]> {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiRequest<Contact[]>(`/contacts${queryString}`);
}

/**
 * Get a single contact by ID
 */
export async function getContact(id: string): Promise<Contact> {
  return apiRequest<Contact>(`/contacts/${id}`);
}

/**
 * Create a new contact
 */
export async function createContact(contact: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
  return apiRequest<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  });
}

/**
 * Update an existing contact
 */
export async function updateContact(id: string, contact: Contact): Promise<void> {
  await apiRequest<void>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...contact, id }),
  });
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<void> {
  await apiRequest<void>(`/contacts/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// EMAIL TEMPLATES API
// ============================================

/**
 * Get all email templates with optional filters
 */
export async function getEmailTemplates(filters?: EmailTemplateFilters): Promise<EmailTemplate[]> {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiRequest<EmailTemplate[]>(`/emailtemplates${queryString}`);
}

/**
 * Get a single email template by ID
 */
export async function getEmailTemplate(id: string): Promise<EmailTemplate> {
  return apiRequest<EmailTemplate>(`/emailtemplates/${id}`);
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EmailTemplate> {
  return apiRequest<EmailTemplate>('/emailtemplates', {
    method: 'POST',
    body: JSON.stringify(template),
  });
}

/**
 * Update an existing email template
 */
export async function updateEmailTemplate(id: string, template: EmailTemplate): Promise<void> {
  await apiRequest<void>(`/emailtemplates/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...template, id }),
  });
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(id: string): Promise<void> {
  await apiRequest<void>(`/emailtemplates/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Clone an email template
 */
export async function cloneEmailTemplate(id: string): Promise<EmailTemplate> {
  return apiRequest<EmailTemplate>(`/emailtemplates/${id}/clone`, {
    method: 'POST',
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Industry options for dropdowns
 */
export const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Consulting',
  'Marketing',
  'Other',
] as const;

/**
 * Status options for contacts
 */
export const CONTACT_STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Qualified',
  'Negotiating',
  'Won',
  'Lost',
  'Unsubscribed',
] as const;

/**
 * Region options for templates
 */
export const REGION_OPTIONS = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East',
  'Africa',
] as const;

/**
 * Sequence position options for templates
 */
export const SEQUENCE_POSITION_OPTIONS = [
  'first',
  'second',
  'third',
  'follow-up',
] as const;

/**
 * Template status options
 */
export const TEMPLATE_STATUS_OPTIONS = [
  'draft',
  'active',
  'archived',
] as const;

/**
 * Employee count options for contacts
 */
export const EMPLOYEE_COUNT_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
] as const;