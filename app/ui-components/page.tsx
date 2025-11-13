'use client';

import React, { useState } from 'react';
import ViewButton from '../../components/ui buttons/ViewButton';
import EditIcon from '../../components/ui buttons/EditIcon';
import DeleteIcon from '../../components/ui buttons/DeleteIcon';
import MoreIcon from '../../components/ui buttons/MoreIcon';
import NotesIcon from '../../components/ui buttons/NotesIcon';
import NoProfilePhotoIcon from '../../components/ui buttons/NoProfilePhotoIcon';
import Checkbox from '../../components/ui buttons/Checkbox';
import StatusDropdown from '../../components/dropdowns/StatusDropdown';
import SortArrowsIcon from '@/components/ui buttons/SortArrowsIcon';
import ColumnOptionsIcon from '@/components/ui buttons/ColumnOptionsIcon';
import AddColumnIcon from '@/components/ui buttons/AddColumnIcon';
import MoveToOpportunityButton from '@/components/ui buttons/MoveToOpportunityButton';
import NoActivityTimeline from '@/components/ui buttons/ActivityTimeline';
// import LeadTable from '../../components/tables/LeadTable';
// import DynamicTable from '../../components/common/DynamicTable';
import FinalTable from '@/components/common/CommonTable';
import ColumnManagerModal from '@/components/common/CommonTable/ColumnManagerModal';
import NewColumnModal from '@/components/common/CommonTable/NewColumnModal';
import type { FieldDefinition } from '@/types/FieldDefinitions';
interface Activity {
  last: string;
}

interface File {
  name: string;
}

interface FinalRow extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
  activity: Activity;
  cta: boolean;
  email: string;
  owner: string;
  phone: string;
  company: string;
  title: string;
  files: File[];
  location: string;
  updatedAt: string;
}

const UIComponentsPage = () => {
  const [currentStatus, setCurrentStatus] = useState('in_progress');
  const [statusOptions, setStatusOptions] = useState([
    { fieldKey: 'todo', displayName: 'To Do', color: '#FF6B35' },
    { fieldKey: 'in_progress', displayName: 'In Progress', color: '#2196F3' },
    { fieldKey: 'done', displayName: 'Done', color: '#4CAF50' },
  ]);

  // FinalTable demo state
  const [finalRows, setFinalRows] = useState<FinalRow[]>([
    {
      id: '1',
      name: 'Aryan Pandit',
      status: 'todo',
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
      status: 'in_progress',
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
  ]);

  const [finalFields, setFinalFields] = useState<FieldDefinition[]>([
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
  ]);

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    [...finalFields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map((f) => f.fieldKey)
  );
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    finalFields.forEach((f) => {
      map[f.fieldKey] = typeof f.columnWidth === 'number' ? f.columnWidth : 180;
    });
    return map;
  });

  const [openManager, setOpenManager] = useState(false);
  const [openNewColumn, setOpenNewColumn] = useState(false);

  const handleStatusChange = (rowIdx: number, newKey: string) => {
    setFinalRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, status: newKey } : r)));
  };
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">UI Components Showcase</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col items-center p-4 border rounded">
              <ViewButton />
              <span className="mt-2 text-sm">ViewButton</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <SortArrowsIcon />
              <span className="mt-2 text-sm">SortArrowsIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <MoveToOpportunityButton />
              <span className="mt-2 text-sm">MoveToOpportunityButton</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Icons</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col items-center p-4 border rounded">
              <EditIcon />
              <span className="mt-2 text-sm">EditIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <DeleteIcon />
              <span className="mt-2 text-sm">DeleteIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <MoreIcon />
              <span className="mt-2 text-sm">MoreIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <NotesIcon />
              <span className="mt-2 text-sm">NotesIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <NoProfilePhotoIcon />
              <span className="mt-2 text-sm">NoProfilePhotoIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <ColumnOptionsIcon />
              <span className="mt-2 text-sm">ColumnOptionsIcon</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <AddColumnIcon />
              <span className="mt-2 text-sm">AddColumnIcon</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Form Elements</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col items-center p-4 border rounded">
              <Checkbox />
              <span className="mt-2 text-sm">Checkbox</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded">
              <NoActivityTimeline />
              <span className="mt-2 text-sm">NoActivityTimeline</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Dropdowns</h2>
          <div className="p-4 border rounded w-full max-w-md">
            <h3 className="text-lg font-medium mb-3">Status Dropdown</h3>
            <StatusDropdown
              currentStatus={currentStatus}
              options={statusOptions}
              onStatusChange={setCurrentStatus}
              onUpdateOption={(fieldKey, updates) => {
                setStatusOptions(prev =>
                  prev.map(opt =>
                    opt.fieldKey === fieldKey ? { ...opt, ...updates } : opt
                  )
                );
              }}
              onAddOption={(option) => {
                const newOption = {
                  ...option,
                  fieldKey: option.displayName.toLowerCase().replace(/\s+/g, '_')
                };
                setStatusOptions(prev => [...prev, newOption]);
                setCurrentStatus(newOption.fieldKey);
              }}
            />
          </div>
        </section>

        {/* <section>
          <h2 className="text-xl font-semibold mb-4">Tables</h2>
          <div className="w-full">
            <h3 className="text-lg font-medium mb-3">Lead Management Table</h3>
            <LeadTable />
          </div>
        </section> */}

        {/* <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Dynamic Table</h2>
          <div className="border rounded p-4">
            <DynamicTable
              fields={[
                { frontendName: 'ID', backendName: 'id', type: 'text', width: '100px' },
                { frontendName: 'Name', backendName: 'name', type: 'text', sortable: true },
                { frontendName: 'Email', backendName: 'email', type: 'text' },
                { frontendName: 'Status', backendName: 'status', type: 'text' },
              ]}
              data={[
                { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
              ]}
              size="middle"
              bordered={true}
              striped={true}
              onSort={(field) => {
                console.log(`Sorting by ${field}`);
              }}
            />
          </div>
        </section> */}

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Final Table (Monday-like skeleton)</h2>
          <div className="border rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                className="px-3 py-1.5 rounded bg-blue-600 text-white"
                onClick={() => setOpenNewColumn(true)}
              >
                Add Column
              </button>
              <button
                className="px-3 py-1.5 rounded border"
                onClick={() => setOpenManager(true)}
              >
                Manage Columns
              </button>
            </div>
            <FinalTable
              // data={finalRows}
              data={finalRows as Record<string, unknown>[]}
              fieldDefinitions={finalFields}
              rowKey="id"
              appearance="figma"
              controlledColumnOrder={columnOrder}
              hiddenFieldKeys={hiddenFieldKeys}
              columnWidths={columnWidths}
              onColumnOrderChange={(ordered) => setColumnOrder(ordered)}
              onHiddenFieldKeysChange={(keys) => setHiddenFieldKeys(keys)}
              onColumnResize={(key, w) => setColumnWidths((prev) => ({ ...prev, [key]: w }))}
              onAddColumn={() => setOpenNewColumn(true)}
              onOpenColumnManager={() => setOpenManager(true)}
              getCellRenderer={({ field, row, rowIndex, value }) => {
                if (field.fieldKey === 'status') {
                  return (
                    <StatusDropdown
                      currentStatus={String(value)}
                      options={statusOptions}
                      onStatusChange={(fk) => handleStatusChange(rowIndex, fk)}
                      onUpdateOption={() => { }}
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
                return undefined; // fallback to default renderer
              }}
            />
          </div>

          {/* Modals */}
          <ColumnManagerModal
            open={openManager}
            onClose={() => setOpenManager(false)}
            fields={finalFields}
            order={columnOrder}
            hiddenFieldKeys={hiddenFieldKeys}
            widths={columnWidths}
            onApply={({ order, hiddenFieldKeys: hidden, widths }) => {
              setColumnOrder(order);
              setHiddenFieldKeys(hidden);
              setColumnWidths(widths);
            }}
          />

          <NewColumnModal
            open={openNewColumn}
            onClose={() => setOpenNewColumn(false)}
            suggestNextOrder={(finalFields[finalFields.length - 1]?.displayOrder ?? finalFields.length) + 1}
            onCreate={(field) => {
              setFinalFields((prev) => [...prev, field]);
              setColumnOrder((prev) => [...prev, field.fieldKey]);
              setColumnWidths((prev) => ({ ...prev, [field.fieldKey]: typeof field.columnWidth === 'number' ? field.columnWidth : 180 }));
              setFinalRows((prev) => prev.map((r) => ({ ...r, [field.fieldKey]: field.defaultValue ?? '' })));
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default UIComponentsPage;
