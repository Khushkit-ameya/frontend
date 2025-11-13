"use client";
import React, { useEffect, useState } from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const TextValue: React.FC<FieldValueProps> = ({ value, className, onCommit }) => {
  const initial = isEmpty(value) ? '' : String(value);
  const [val, setVal] = useState(initial);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setVal(isEmpty(value) ? '' : String(value));
  }, [value]);

  // Read-only mode (no onCommit function)
  if (!onCommit) {
    if (isEmpty(value)) return <Fallback className={className} />;
    const str = String(value);
    return <span className={className ? `${className} truncate block` : 'truncate block'} style={{ maxWidth: '200px' }} title={str}>{str}</span>;
  }

  // Editable mode
  return (
    <div className={className ? `${className} inline-flex items-center justify-start` : 'inline-flex items-center justify-start'}>
      {!editing ? (
        <span title={val} onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="truncate block" style={{ maxWidth: '200px' }}>
          {val || <Fallback />}
        </span>
      ) : (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={async (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') { await onCommit(val); setEditing(false); }
            else if (e.key === 'Escape') { setVal(initial); setEditing(false); }
          }}
          onBlur={async () => { if (val !== initial) await onCommit(val); setEditing(false); }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-[140px] bg-transparent border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
};

export default TextValue;