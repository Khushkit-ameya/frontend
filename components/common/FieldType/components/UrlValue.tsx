"use client";
import React, { useEffect, useState } from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const UrlValue: React.FC<FieldValueProps> = ({ value, className, onCommit }) => {
  const initial = isEmpty(value) ? '' : String(value);
  const [val, setVal] = useState(initial);
  const [hovering, setHovering] = useState(false);
  const [hoveringLink, setHoveringLink] = useState(false);
  const [editing, setEditing] = useState(false);
  
  useEffect(() => {
    setVal(isEmpty(value) ? '' : String(value));
  }, [value]);

  const hasUrl = val.trim().length > 0;

  // Read-only mode (no onCommit provided)
  if (!onCommit) {
    if (isEmpty(value)) return <Fallback className={className} />;
    const v = String(value);
    return (
      <a href={v} target="_blank" rel="noreferrer" className={className ? `${className} text-blue-600 hover:underline justify-start truncate block` : 'text-blue-600 hover:underline justify-start truncate block'} style={{ maxWidth: '200px' }} title={v}>
        {v}
      </a>
    );
  }

  // Editable mode (onCommit provided)
  return (
    <div
      className={className ? `${className} inline-flex items-center justify-start` : 'inline-flex items-center justify-start'}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { if (!editing) { setHovering(false); setHoveringLink(false); } }}
      onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
    >
      {(!editing && (!hovering || hoveringLink)) ? (
        hasUrl ? (
          <a
            href={val}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline justify-start truncate block"
            style={{ maxWidth: '200px' }}
            title={val}
            onMouseEnter={() => setHoveringLink(true)}
            onMouseLeave={() => setHoveringLink(false)}
            onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
          >
            {val}
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ) : (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setEditing(true)}
          onKeyDown={async (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              await onCommit(val);
              setEditing(false);
              setHovering(false);
            } else if (e.key === 'Escape') {
              setVal(initial);
              setEditing(false);
              setHovering(false);
            }
          }}
          onBlur={async () => {
            if (val !== initial) await onCommit(val);
            setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-[140px] bg-transparent border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
};

export default UrlValue;