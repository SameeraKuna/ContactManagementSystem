import LeadWizard from '@/components/LeadWizard';

export default function LeadsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600">Add New Lead</h1>
        <p className="text-gray-600 mt-1">
          Fill in the details below to add a new lead to your contact database.
        </p>
      </div>
      
      <LeadWizard />
    </div>
  );
}