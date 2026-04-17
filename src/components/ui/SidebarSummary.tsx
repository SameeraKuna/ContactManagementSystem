'use client';

interface SummaryItem {
  label: string;
  value: string | number | undefined;
}

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface SidebarSummaryProps {
  title: string;
  items: SummaryItem[];
  checklist?: ChecklistItem[];
  checklistTitle?: string;
  className?: string;
  footer?: React.ReactNode;
}

export default function SidebarSummary({
  title,
  items,
  checklist,
  checklistTitle = 'Checklist',
  className = '',
  footer,
}: SidebarSummaryProps) {
  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
    >
      {/* Summary Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {title}
        </h3>
        <dl className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <dt className="text-gray-600">{item.label}</dt>
              <dd className="font-medium text-gray-900 text-right">
                {item.value || '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Checklist Section */}
      {checklist && checklist.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {checklistTitle}
          </h3>
          <ul className="space-y-2">
            {checklist.map((item, index) => (
              <li key={index} className="flex items-center text-sm">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    item.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={
                    item.completed ? 'text-green-700' : 'text-gray-500'
                  }
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Section */}
      {footer && (
        <div className="border-t border-gray-200 pt-4 mt-4">{footer}</div>
      )}
    </div>
  );
}