"use client";
import React, { useCallback, useState } from 'react';
import NotesIcon from '@/components/ui buttons/NotesIcon';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

// Renders a single-line name with a trailing Notes icon. Supports inline editing via onCommit.
const NameWithNotesIcon: React.FC<FieldValueProps & { onNotesClick?: () => void }> = ({ value, className, onCommit, onNotesClick }) => {
  const initial = isEmpty(value) ? '' : String(value);
  const [val, setVal] = useState(initial);
  const [editing, setEditing] = useState(false);

  const start = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }, []);
  const commit = useCallback(async () => {
    setEditing(false);
    if (onCommit && val !== initial) await onCommit(val);
  }, [onCommit, val, initial]);
  const cancel = useCallback(() => {
    setVal(initial);
    setEditing(false);
  }, [initial]);

  return (
    <div className="flex items-stretch justify-between gap-2 min-w-0">
      {!editing ? (
        <span className={className ? `${className} truncate` : 'truncate'} style={{ maxWidth: '150px' }} title={initial} onClick={start}>
          {initial || <Fallback />}
        </span>
      ) : (
        <input
          autoFocus
          className="w-full border rounded px-1 py-0.5 text-sm min-w-0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="flex items-center self-stretch pl-2 ml-1 border-l -my-px" style={{ borderColor: '#CBD5E1' }}>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-100"
          onClick={(e) => { e.stopPropagation(); onNotesClick?.(); }}
          title="Notes"
          aria-label="Notes"
        >
          <NotesIcon />
        </button>
      </div>
    </div>
  );
};

export default NameWithNotesIcon;
