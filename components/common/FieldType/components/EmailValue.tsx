"use client";
import React, { useEffect, useState } from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const EmailValue: React.FC<FieldValueProps> = ({ value, className, onCommit }) => {
  const initial = isEmpty(value) ? '' : String(value);
  const [val, setVal] = useState(initial);
  useEffect(() => {
    setVal(isEmpty(value) ? '' : String(value));
  }, [value]);
  const [hovering, setHovering] = useState(false);
  const [hoveringLink, setHoveringLink] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!onCommit) {
    if (isEmpty(value)) return <Fallback className={className} />;
    const v = String(value);
    return (
      <a href={`mailto:${v}`} className={className ? `${className} hover:underline truncate block` : 'hover:underline truncate block'} style={{ color: '#4F5051', maxWidth: '200px', paddingLeft: '2px', paddingRight: '2px' }} title={v}>
        {v}
      </a>
    );
  }

  const hasEmail = val.trim().length > 0;

  return (
    <div
      className={className ? `${className} flex items-center w-full justify-start` : 'flex items-center w-full justify-start'}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { if (!editing) { setHovering(false); setHoveringLink(false); } }}
      onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
      onClick={(e) => { if (!hoveringLink) { e.stopPropagation(); setEditing(true); } }}
      style={hovering && !editing ? { backgroundColor: '#f3f4f6', borderRadius: '4px', padding: '2px 4px', margin: '-2px -4px' } : {}}
    >
      {(!editing && (!hovering || hoveringLink)) ? (
        hasEmail ? (
          <a
            href={`mailto:${val}`}
            className="hover:underline justify-start truncate block"
            style={{ color: '#4F5051', maxWidth: '200px', marginLeft: '4px', marginRight: '4px' }}
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
            setHovering(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-[140px] bg-white border border-blue-500 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
};

export default EmailValue;
