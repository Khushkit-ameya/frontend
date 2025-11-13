'use client';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Plus, Palette, Trash2 } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';

interface PriorityOption {
  fieldKey: string;
  displayName: string;
  color: string;
}

interface PriorityDropdownProps {
  currentPriority: string;
  options: PriorityOption[];
  onPriorityChange: (fieldKey: string) => void;
  onUpdateOption: (fieldKey: string, updates: Partial<PriorityOption>) => void;
  onAddOption?: (option: Omit<PriorityOption, 'fieldKey'>) => void;
  onReorderOptions?: (ordered: PriorityOption[]) => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  onDeleteOption?: (fieldKey: string) => void;
}

export const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  currentPriority,
  options,
  onPriorityChange,
  onUpdateOption,
  onAddOption,
  onReorderOptions,
  disabled = false,
  className = '',
  fullWidth = false,
  onDeleteOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [showNewOption, setShowNewOption] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('#3b82f6');
  const [localOptions, setLocalOptions] = useState<PriorityOption[]>(options);
  const dragFromRef = useRef<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [bottomSpacer, setBottomSpacer] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editValueRef = useRef('');

  useEffect(() => setLocalOptions(options), [options]);

  const currentOption = localOptions.find(opt => opt.fieldKey === currentPriority);

  useEffect(() => {
    editValueRef.current = editValue;
  }, [editValue]);

  useEffect(() => {
    if (editingOption && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingOption]);

    useEffect(() => {
    if (!isOpen) return;
    const updatePos = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuPos({ left: Math.round(r.left), top: Math.round(r.bottom + 4), width: Math.round(r.width) });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) { setBottomSpacer(0); return; }
    const el = menuContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const overflow = rect.bottom + 8 - window.innerHeight;
    if (overflow > 0) {
      setBottomSpacer(Math.ceil(overflow));
    } else {
      setBottomSpacer(0);
    }
    if (menuPos) {
      const desiredTop = Math.min(menuPos.top, Math.max(8, window.innerHeight - rect.height - 8));
      if (desiredTop !== menuPos.top) {
        setMenuPos({ ...menuPos, top: desiredTop });
      }
    }
  }, [isOpen, menuPos?.top, showNewOption, showColorPicker, isEditMode, localOptions.length]);

  const handlePrioritySelect = (fieldKey: string) => {
    if (editingOption || showColorPicker) return;
    onPriorityChange(fieldKey);
    setIsOpen(false);
  };

  const handleEditStart = (option: PriorityOption, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOption(option.fieldKey);
    setEditValue(option.displayName);
  };

  const handleEditSave = (fieldKey: string, value?: string) => {
    const newName = (value ?? editValueRef.current).trim();
    if (newName && newName !== localOptions.find(opt => opt.fieldKey === fieldKey)?.displayName) {
      onUpdateOption(fieldKey, { displayName: newName });
    }
    setEditingOption(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingOption(null);
    setEditValue('');
  };

  const handleColorChange = (fieldKey: string, color: string) => {
    window.setTimeout(() => {
      setLocalOptions((prev) => prev.map(o => o.fieldKey === fieldKey ? { ...o, color } : o));
      setShowColorPicker(null);
      onUpdateOption(fieldKey, { color });
    }, 0);
  };

  const handleAddNewOption = () => {
    if (newOptionName.trim() && onAddOption) {
      onAddOption({
        displayName: newOptionName.trim(),
        color: newOptionColor
      });
      setShowNewOption(false);
      setNewOptionName('');
      setNewOptionColor('#3b82f6');
    }
  };

  const minButtonWidth = useMemo(() => {
    if (!localOptions || localOptions.length === 0) return 120;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 140;
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    const longest = localOptions.reduce((acc, o) => (o.displayName.length > acc.length ? o.displayName : acc), '');
    const width = ctx.measureText(longest || 'Select priority').width;
    return Math.max(140, Math.ceil(width + 40));
  }, [localOptions.map(o => o.displayName).join('|')]);

  const PriorityButton = ({ option, isSelected = false }: { option: PriorityOption; isSelected?: boolean }) => (
    <div
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${isSelected
        ? 'bg-gray-50'
        : 'hover:bg-gray-50'
        }`}
      style={{ borderColor: isSelected ? option.color : 'transparent' }}
      onClick={(e) => {
        if (editingOption || showColorPicker) return;
        handlePrioritySelect(option.fieldKey);
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: option.color }}
        />
        {editingOption === option.fieldKey && isEditMode ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => {
              e.stopPropagation();
              setEditValue(e.target.value);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEditSave(option.fieldKey, (e.currentTarget as HTMLInputElement).value);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleEditCancel();
              }
            }}
            onBlur={(e) => {
              e.stopPropagation();
              const value = (e.currentTarget as HTMLInputElement).value;
              setTimeout(() => handleEditSave(option.fieldKey, value), 0);
            }}
            className="bg-white border rounded px-2 py-1 text-sm min-w-0 flex-1"
            style={{ borderColor: option.color }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`text-sm truncate ${!isEditMode ? 'pr-4' : ''}`}
            style={{ color: option.color }}
            onClick={() => !isEditMode && handlePrioritySelect(option.fieldKey)}
          >
            {option.displayName}
          </span>
        )}
      </div>

      {isEditMode && (
        <div className={`flex items-center gap-1 transition-opacity flex-shrink-0 ml-2 ${editingOption === option.fieldKey ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="w-3 h-3 rounded-sm bg-gray-300 cursor-grab" draggable onDragStart={(e) => {
            e.stopPropagation();
            dragFromRef.current = option.fieldKey;
            e.dataTransfer.effectAllowed = 'move';
          }} title="Drag to reorder" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(showColorPicker === option.fieldKey ? null : option.fieldKey);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Change color"
          >
            <Palette size={12} className="text-gray-500" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => handleEditStart(option, e)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Edit label"
          >
            <Edit2 size={12} className="text-gray-500" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete "${option.displayName}"?`)) {
                onDeleteOption?.(option.fieldKey);
              }
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Delete label"
          >
            <Trash2 size={12} className="text-red-500" />
          </button>
        </div>
      )}
    </div>
  );

  if (disabled) {
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-not-allowed opacity-60 ${className}`}
        disabled
      >
        {currentOption && (
          <>
            <span className="truncate" style={{ color: currentOption.color }}>{currentOption.displayName}</span>
          </>
        )}
      </button>
    );
  }



  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex px-3 py-2 border bg-white hover:bg-gray-50 transition-colors text-sm leading-5 h-[48px] min-h-[48px] rounded-[8px] items-center ${fullWidth ? 'w-full justify-between' : 'justify-center'
          }`}
        style={{
          borderColor: currentOption ? currentOption.color : '#D1D5DB',
          minWidth: fullWidth ? 'auto' : minButtonWidth
        }}
      >
        {currentOption ? (
          <span className="truncate" style={{ color: currentOption.color }}>
            {currentOption.displayName}
          </span>
        ) : (
          <span className="text-gray-500 truncate">Select status</span>
        )}
        {/* Add dropdown arrow */}
        <svg
          className={`w-4 h-4 ml-2 text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && menuPos ? createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            ref={menuContainerRef}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] py-2"
            style={{ left: menuPos.left, top: menuPos.top, width: 256, maxHeight: 'calc(100vh - 16px)', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-64 overflow-y-auto">
              {localOptions.map((option) => (
                <div
                  key={option.fieldKey}
                  className="group px-2"
                  onDragOver={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    const from = dragFromRef.current;
                    dragFromRef.current = null;
                    if (!from || from === option.fieldKey) return;
                    const old = [...localOptions];
                    const fromIdx = old.findIndex(o => o.fieldKey === from);
                    const toIdx = old.findIndex(o => o.fieldKey === option.fieldKey);
                    if (fromIdx === -1 || toIdx === -1) return;
                    old.splice(fromIdx, 1);
                    old.splice(toIdx, 0, localOptions.find(o => o.fieldKey === from)!);
                    setLocalOptions(old);
                    onReorderOptions?.(old);
                  }}
                >
                  <PriorityButton
                    option={option}
                    isSelected={option.fieldKey === currentPriority}
                  />
                  {isEditMode && showColorPicker === option.fieldKey && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                      <ColorPicker
                        value={option.color}
                        onChange={(hex) => handleColorChange(option.fieldKey, hex)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2">
              {isEditMode && showNewOption ? (
                <div className="px-2" onClick={(e) => e.stopPropagation()}>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Label name"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded mb-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNewOption();
                        } else if (e.key === 'Escape') {
                          setShowNewOption(false);
                          setNewOptionName('');
                        }
                      }}
                      autoFocus
                    />
                    <ColorPicker value={newOptionColor} onChange={(hex) => setNewOptionColor(hex)} className="mb-2" />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddNewOption}
                        disabled={!newOptionName.trim()}
                        className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewOption(false);
                          setNewOptionName('');
                        }}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditMode && onAddOption) {
                      setShowNewOption(true);
                    } else {
                      setIsEditMode(!isEditMode);
                      setEditingOption(null);
                      setShowColorPicker(null);
                      setShowNewOption(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full text-left"
                >
                  {isEditMode ? (
                    <>
                      <Plus size={14} />
                      Add Label
                    </>
                  ) : (
                    <>
                      <Edit2 size={14} />
                      Edit Labels
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} />}
        </>, document.body)
        : null}
    </div>
  );
};

export default PriorityDropdown;