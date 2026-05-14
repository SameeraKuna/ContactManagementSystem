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
  industries?: string[];
  regions?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Sequence Types
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';
export type EnrolmentStatus = 'pending' | 'in_progress' | 'completed' | 'unsubscribed' | 'bounced' | 'paused';

export interface Sequence {
  id?: string;
  name: string;
  template1Id: string;
  template2Id?: string;
  delayDays: number;
  sendTime: string;
  sendWeekdaysOnly: boolean;
  status: SequenceStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Populated fields (from API)
  template1?: EmailTemplate;
  template2?: EmailTemplate;
  stats?: SequenceStats;
}

export interface SequenceStats {
  totalEnrolled: number;
  pending: number;
  inProgress: number;
  completed: number;
  unsubscribed: number;
  bounced: number;
}

export interface SequenceEnrolment {
  id?: string;
  contactId: string;
  sequenceId: string;
  currentStep: number;
  status: EnrolmentStatus;
  nextSendAt?: string;
  enrolledAt?: string;
  completedAt?: string;
  contact?: Contact;
}

export interface SequenceFilters {
  [key: string]: string | undefined;
  status?: string;
  search?: string;
}

export interface SequenceListResponse {
  items: Sequence[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface EnrolmentResponse {
  enrolled: number;
  skipped: number;
  skippedReasons: {
    contactId: string;
    reason: 'already_enrolled' | 'unsubscribed' | 'bounced' | 'no_email';
  }[];
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
 * Industry options for dropdowns (per spec)
 */
export const INDUSTRY_OPTIONS = [
  'SaaS',
  'Fintech',
  'Healthcare',
  'E-commerce',
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
 * Employee count options for contacts (per spec)
 */
export const EMPLOYEE_COUNT_OPTIONS = [
  '10-50',
  '51-100',
  '101-250',
  '250+',
] as const;

/**
 * Sequence status options
 */
export const SEQUENCE_STATUS_OPTIONS = [
  'draft',
  'active',
  'paused',
  'archived',
] as const;

/**
 * Delay days options for sequences
 */
export const DELAY_DAYS_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
  { value: '4', label: '4 days' },
  { value: '5', label: '5 days' },
  { value: '7', label: '7 days (1 week)' },
  { value: '10', label: '10 days' },
  { value: '14', label: '14 days (2 weeks)' },
] as const;

// ============================================
// SEQUENCES API
// ============================================

/**
 * Get all sequences with optional filters
 */
export async function getSequences(filters?: SequenceFilters): Promise<SequenceListResponse> {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiRequest<SequenceListResponse>(`/sequences${queryString}`);
}

/**
 * Get a single sequence by ID (includes templates and stats)
 */
export async function getSequence(id: string): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${id}`);
}

/**
 * Create a new sequence
 */
export async function createSequence(
  sequence: Omit<Sequence, 'id' | 'createdAt' | 'updatedAt' | 'template1' | 'template2' | 'stats'>
): Promise<Sequence> {
  return apiRequest<Sequence>('/sequences', {
    method: 'POST',
    body: JSON.stringify(sequence),
  });
}

/**
 * Update an existing sequence
 */
export async function updateSequence(id: string, sequence: Partial<Sequence>): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...sequence, id }),
  });
}

/**
 * Delete a sequence (only draft sequences can be deleted)
 */
export async function deleteSequence(id: string): Promise<void> {
  await apiRequest<void>(`/sequences/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Activate a draft sequence
 */
export async function activateSequence(id: string): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${id}/activate`, {
    method: 'POST',
  });
}

/**
 * Pause an active sequence
 */
export async function pauseSequence(id: string): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${id}/pause`, {
    method: 'POST',
  });
}

/**
 * Resume a paused sequence
 */
export async function resumeSequence(id: string): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${id}/resume`, {
    method: 'POST',
  });
}

/**
 * Archive a sequence
 */
export async function archiveSequence(id: string): Promise<Sequence> {
  return apiRequest<Sequence>(`/sequences/${id}/archive`, {
    method: 'POST',
  });
}

// ============================================
// SEQUENCE ENROLMENTS API
// ============================================

/**
 * Get enrolments for a sequence
 */
export async function getSequenceEnrolments(
  sequenceId: string,
  filters?: { status?: string; step?: string; search?: string }
): Promise<SequenceEnrolment[]> {
  const queryString = filters ? buildQueryString(filters as Record<string, string | undefined>) : '';
  return apiRequest<SequenceEnrolment[]>(`/sequences/${sequenceId}/enrolments${queryString}`);
}

/**
 * Enrol contacts into a sequence (bulk)
 */
export async function enrolContacts(
  sequenceId: string,
  contactIds: string[]
): Promise<EnrolmentResponse> {
  return apiRequest<EnrolmentResponse>(`/sequences/${sequenceId}/enrol`, {
    method: 'POST',
    body: JSON.stringify({ contactIds }),
  });
}

/**
 * Remove a contact from a sequence
 */
export async function removeEnrolment(sequenceId: string, enrolmentId: string): Promise<void> {
  await apiRequest<void>(`/sequences/${sequenceId}/enrolments/${enrolmentId}`, {
    method: 'DELETE',
  });
}

/**
 * Pause an enrolment
 */
export async function pauseEnrolment(sequenceId: string, enrolmentId: string): Promise<SequenceEnrolment> {
  return apiRequest<SequenceEnrolment>(`/sequences/${sequenceId}/enrolments/${enrolmentId}/pause`, {
    method: 'POST',
  });
}

/**
 * Resume a paused enrolment
 */
export async function resumeEnrolment(sequenceId: string, enrolmentId: string): Promise<SequenceEnrolment> {
  return apiRequest<SequenceEnrolment>(`/sequences/${sequenceId}/enrolments/${enrolmentId}/resume`, {
    method: 'POST',
  });
}

/**
 * Get contacts available for enrolment (not already enrolled, not unsubscribed/bounced)
 */
export async function getEnrollableContacts(
  sequenceId: string,
  filters?: ContactFilters
): Promise<Contact[]> {
  const queryString = filters ? buildQueryString(filters) : '';
  return apiRequest<Contact[]>(`/sequences/${sequenceId}/enrollable-contacts${queryString}`);
}

// ============================================
// SCHEDULES API
// ============================================

// Schedule Types
export interface Schedule {
  id?: string;
  name: string;
  sequenceType: 'first_only' | 'second_only' | 'full_sequence';
  status: 'draft' | 'active' | 'paused' | 'completed';
  recurrence: 'once' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  companies?: ScheduleCompany[];
  templateAssignments?: ScheduleTemplateAssignment[];
  countryTimings?: ScheduleCountryTiming[];
  totalCompanies?: number;
  totalContacts?: number;
  totalCountries?: number;
  nextRunDate?: string;
}

export interface ScheduleCompany {
  companyName: string;
  contactCount?: number;
  industry?: string;
  region?: string;
  countries?: string[];
}

export interface ScheduleTemplateAssignment {
  templateId: string;
  templateName?: string;
  subject?: string;
  sequencePosition: 'first' | 'second';
}

export interface ScheduleCountryTiming {
  countryName: string;
  timezone: string;
  sendTime: string;
  weekdaysOnly: boolean;
  contactCount?: number;
}

export interface ScheduleListItem {
  id: string;
  name: string;
  status: string;
  recurrence: string;
  startDate: string;
  totalCompanies: number;
  totalContacts: number;
  templateName?: string;
  nextRunDate?: string;
  createdAt: string;
}

export interface SchedulePreview {
  totalContacts: number;
  contactsToSend: number;
  contactsExcluded: number;
  exclusions: { reason: string; count: number }[];
  countryBreakdown: {
    countryName: string;
    timezone: string;
    sendTime: string;
    contactCount: number;
    excludedCount: number;
  }[];
}

export interface CompanyWithContacts {
  companyName: string;
  industry?: string;
  region?: string;
  contactCount: number;
  countries: string[];
}

export interface CountryInfo {
  name: string;
  timezone: string;
  utcOffset: string;
}

export interface CreateScheduleRequest {
  name: string;
  sequenceType: string;
  recurrence: string;
  startDate: string;
  endDate?: string;
  companyNames: string[];
  templateAssignments: { templateId: string; sequencePosition: string }[];
  countryTimings: { countryName: string; timezone: string; sendTime: string; weekdaysOnly: boolean }[];
}

/**
 * Get all schedules
 */
export async function getSchedules(): Promise<ScheduleListItem[]> {
  return apiRequest<ScheduleListItem[]>('/schedules');
}

/**
 * Get a single schedule by ID
 */
export async function getSchedule(id: string): Promise<Schedule> {
  return apiRequest<Schedule>(`/schedules/${id}`);
}

/**
 * Create a new schedule
 */
export async function createSchedule(schedule: CreateScheduleRequest): Promise<Schedule> {
  return apiRequest<Schedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  });
}

/**
 * Update a schedule
 */
export async function updateSchedule(id: string, schedule: Partial<CreateScheduleRequest>): Promise<Schedule> {
  return apiRequest<Schedule>(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schedule),
  });
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<void> {
  await apiRequest<void>(`/schedules/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Activate a schedule
 */
export async function activateSchedule(id: string): Promise<Schedule> {
  return apiRequest<Schedule>(`/schedules/${id}/activate`, {
    method: 'POST',
  });
}

/**
 * Pause a schedule
 */
export async function pauseSchedule(id: string): Promise<Schedule> {
  return apiRequest<Schedule>(`/schedules/${id}/pause`, {
    method: 'POST',
  });
}

/**
 * Get schedule preview
 */
export async function getSchedulePreview(id: string): Promise<SchedulePreview> {
  return apiRequest<SchedulePreview>(`/schedules/${id}/preview`, {
    method: 'POST',
  });
}

// ============================================
// COMPANIES API (for Schedule Builder)
// ============================================

/**
 * Get all companies with contact counts
 */
export async function getCompanies(filters?: { industry?: string; region?: string; search?: string }): Promise<CompanyWithContacts[]> {
  const queryString = filters ? buildQueryString(filters as Record<string, string | undefined>) : '';
  return apiRequest<CompanyWithContacts[]>(`/companies${queryString}`);
}

/**
 * Get distinct industries from contacts
 */
export async function getIndustries(): Promise<string[]> {
  return apiRequest<string[]>('/companies/industries');
}

/**
 * Get countries with timezone info
 */
export async function getCountries(): Promise<CountryInfo[]> {
  return apiRequest<CountryInfo[]>('/companies/countries');
}

/**
 * Get contact breakdown for selected companies
 */
export async function getCompanyContacts(companyNames: string[]): Promise<{ totalContacts: number; countryBreakdown: { country: string; timezone: string; contactCount: number }[] }> {
  return apiRequest<{ totalContacts: number; countryBreakdown: { country: string; timezone: string; contactCount: number }[] }>('/companies/contacts', {
    method: 'POST',
    body: JSON.stringify(companyNames),
  });
}

// Schedule recurrence options
export const SCHEDULE_RECURRENCE_OPTIONS = [
  { value: 'once', label: 'One Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

// Sequence type options
export const SCHEDULE_SEQUENCE_TYPE_OPTIONS = [
  { value: 'first_only', label: 'First Email Only' },
  { value: 'second_only', label: 'Second Email Only' },
  { value: 'full_sequence', label: 'Full Sequence (Both Emails)' },
] as const;