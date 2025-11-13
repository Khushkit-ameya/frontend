'use client';

import React, { useMemo, useState } from 'react';
import FinalTable from './index';
import { FieldDefinition } from '@/types/FieldDefinitions';
import StatusDropdown from '@/components/dropdowns/StatusDropdown';
import MoveToOpportunityButton from '@/components/ui buttons/MoveToOpportunityButton';

// Status options example (can be fetched)
const statusOptions = [
  { fieldKey: 'new_lead', displayName: 'New Lead', color: '#FDAB3D' },
  { fieldKey: 'contacted', displayName: 'Contacted', color: '#FF6D3B' },
  { fieldKey: 'qualified', displayName: 'Qualified', color: '#9CD326' },
  { fieldKey: 'unqualified', displayName: 'Unqualified', color: '#BB3354' },
  { fieldKey: 'attempted_contact', displayName: 'Attempted to Contact', color: '#FFADAD' },
];

const SAMPLE_FIELDS: FieldDefinition[] = [
  { fieldKey: 'name', displayName: 'Lead', fieldType: 'TEXT', displayOrder: 1, columnWidth: 220 },
  { fieldKey: 'status', displayName: 'Status', fieldType: 'DROPDOWN', displayOrder: 2, columnWidth: 180 },
  { fieldKey: 'activity.last', displayName: 'Activities Timeline', fieldType: 'TEXT', displayOrder: 3, columnWidth: 180 },
  { fieldKey: 'cta', displayName: 'Close to Opportunity', fieldType: 'TEXT', displayOrder: 4, columnWidth: 220 },
  { fieldKey: 'email', displayName: 'Email', fieldType: 'EMAIL', displayOrder: 5, columnWidth: 240 },
  { fieldKey: 'owner', displayName: 'Owner', fieldType: 'TEXT', displayOrder: 6 },
  { fieldKey: 'phone', displayName: 'Contact', fieldType: 'PHONE', displayOrder: 7 },
  { fieldKey: 'company', displayName: 'Company', fieldType: 'TEXT', displayOrder: 8 },
  { fieldKey: 'title', displayName: 'Title', fieldType: 'TEXT', displayOrder: 9 },
  { fieldKey: 'files', displayName: 'Files/Link', fieldType: 'FILE_UPLOAD', displayOrder: 10 },
  { fieldKey: 'location', displayName: 'Location', fieldType: 'TEXT', displayOrder: 11 },
  { fieldKey: 'updatedAt', displayName: 'Last Updated', fieldType: 'DATE_TIME', displayOrder: 12 },
];

const SAMPLE_DATA = [
  {
    id: '1',
    name: 'Aryan Pandit',
    status: 'new_lead',
    activity: { last: '20s ago' },
    cta: true,
    email: 'ra.aryan306@gmail.com',
    owner: 'Admin',
    phone: '+91 9973343722',
    company: 'Microsoft',
    title: 'Team Lead',
    files: [{ name: 'file.pdf' }],
    location: 'May 29, Cube Complex 2025',
    updatedAt: '2025-05-29T12:25:00Z',
  },
  {
    id: '2',
    name: 'Seven Court',
    status: 'contacted',
    activity: { last: '20s ago' },
    cta: false,
    email: 'steve@gmail.com',
    owner: 'John',
    phone: '+91 6077223342',
    company: 'Travel Agency',
    title: 'Sales',
    files: [{ name: 'brief.docx' }],
    location: 'May 29, Cube Complex 2025',
    updatedAt: '2025-05-29T12:23:00Z',
  },
];

const ExampleUsage: React.FC = () => {
  const [rows, setRows] = useState(SAMPLE_DATA);
  const [fields, setFields] = useState<FieldDefinition[]>(SAMPLE_FIELDS);

  const handleStatusChange = (rowIndex: number, fieldKey: string) => {
    setRows((prev) => prev.map((r, i) => (i === rowIndex ? { ...r, status: fieldKey } : r)));
  };

  const handleAddColumn = () => {
    // Skeleton: demonstrate adding a simple TEXT column to the end
    const newKey = `custom_${fields.length + 1}`;
    const newField: FieldDefinition = {
      fieldKey: newKey,
      displayName: 'New Column',
      fieldType: 'TEXT',
      displayOrder: (fields[fields.length - 1]?.displayOrder ?? fields.length) + 1,
    };
    setFields((prev) => [...prev, newField]);
    setRows((prev) => prev.map((r) => ({ ...r, [newKey]: '' })));
  };

  return (
    <div className="p-4">
      <FinalTable
        data={rows}
        fieldDefinitions={fields}
        rowKey="id"
        onAddColumn={handleAddColumn}
        onSortChange={(cfg) => console.log('Sort change', cfg)}
        onSelectionChange={(keys, selected) => console.log('Selected', keys, selected)}
        getCellRenderer={({ field, row, rowIndex, value }) => {
          // Demo: inject components for special columns (skeleton only)
          if (field.fieldKey === 'status') {
            return (
              <StatusDropdown
                currentStatus={String(value)}
                options={statusOptions}
                onStatusChange={(fk) => handleStatusChange(rowIndex, fk)}
                onUpdateOption={() => {}}
                className="min-w-[140px]"
              />
            );
          }
          if (field.fieldKey === 'cta') {
            return (
              <div className="flex items-center">
                <MoveToOpportunityButton />
              </div>
            );
          }
          return undefined; // fall back to default cell rendering
        }}
      />
    </div>
  );
};

export default ExampleUsage;
