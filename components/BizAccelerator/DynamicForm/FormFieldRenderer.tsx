"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import {
  TextField,
  FormHelperText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ErrorMessage } from '@hookform/error-message';
import { FieldDefinition } from './types';
import { FieldWrapper } from './FieldWrapper';
import { StatusDropdown } from '@/components/dropdowns/StatusDropdown';
import { TagsAndContactGroup } from '@/components/dropdowns/RenderTags';
import { UserDropdown } from '@/components/common/forms/UserDropdown';
import { useGetCompanyUsersQuery, useGetCurrentUserQuery } from '@/store/api_query/auth.api';
/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type ChoiceObject = {
  value: string;
  label: string;
  displayName?: string;
  color?: string;
  isActive?: boolean;
};

type Choice = string | ChoiceObject;

interface FormFieldRendererProps {
  field: FieldDefinition;
  form: UseFormReturn<Record<string, unknown>>;
  onAddDropdownOption?: (
    fieldId: string,
    option: { displayName: string; color: string }
  ) => Promise<void>;
  onUpdateDropdownOption?: (
    fieldId: string,
    value: string,
    updates: { displayName?: string; color?: string }
  ) => Promise<void>;
  onReorderDropdownOptions?: (
    fieldId: string,
    orderedOptions: Array<{
      fieldKey: string;
      displayName: string;
      color: string;
    }>
  ) => Promise<void>;
  onDeleteDropdownOption?: (
    fieldId: string,
    value: string
  ) => Promise<void>;
  onLinkOpportunity?: (dealData: unknown) => void;
  dealData?: unknown;
  onConvertToLead?: (contactId: string) => Promise<void>;
  convertingIds?: Set<string | number>;
  onConvertToOpportunity?: (leadId: string) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    height: '48px',
    borderRadius: '8px',
    '&:hover fieldset': { borderColor: '#d1d5db' },
    '&.Mui-focused fieldset': { borderColor: '#C81C1F', borderWidth: '2px' },
    '&.Mui-error fieldset': { borderColor: '#ef4444' },
  },
  '& .MuiInputBase-input': { height: 'auto', padding: '12px 14px', fontSize: '0.875rem' },
  '& .MuiInputLabel-root': { fontSize: '0.875rem', '&.Mui-focused': { color: '#C81C1F' } },
} as const;

const selectStyles = { ...textFieldStyles, '& .MuiSelect-select': { padding: '12px 14px' } } as const;

const textAreaStyles = {
  ...textFieldStyles,
  '& .MuiOutlinedInput-root': { ...textFieldStyles['& .MuiOutlinedInput-root'], height: 'auto', alignItems: 'flex-start' },
} as const;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  form: { control, register, formState: { errors } },
  onAddDropdownOption,
  onUpdateDropdownOption,
  onReorderDropdownOptions,
  onDeleteDropdownOption,
  onLinkOpportunity,
  dealData,
  onConvertToLead,
  convertingIds,
  onConvertToOpportunity,
}) => {
  const { fieldKey, displayName, fieldType, isRequired, options, isReadOnly } = field;
  const { data: companyUsersData } = useGetCompanyUsersQuery({});
  const { data: currentUser } = useGetCurrentUserQuery();

  /* -------------------------------- Tags / ContactGroup state ------- */
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* -------------------------------- Utility ------------------------- */
  const useNormalDropdown = fieldKey === 'relatedTo' || fieldKey === 'contactStatus' || fieldKey === 'relatedEntity';

  const rules: Record<string, unknown> = {};
  if (isRequired) rules.required = `${displayName} is required`;

  if (fieldType === 'EMAIL') {
    rules.pattern = { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' };
  }
  if (fieldType === 'PHONE') {
    rules.pattern = { value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, message: 'Invalid phone number' };
  }

  /* -------------------------------- Render -------------------------- */

  /* -------- Special buttons --------------------------------------- */
  if (fieldKey === 'createOpportunity') {
    if (!dealData || typeof dealData !== 'object' || !('id' in dealData)) {
      return (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-[29px] h-[29px] bg-[#C81C1F] rounded-lg">
              <img src="/icons/project/tags.svg" alt="Convert to opportunity" className="w-4 h-4" />
            </div>
            <label className="text-sm font-medium text-gray-700">Convert to Opportunity</label>
          </div>
          <div className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded border border-gray-300 w-full text-center">
            <span className="italic">Save lead first to convert</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Please save the lead before converting to opportunity</p>
        </div>
      );
    }

    const id = (dealData as { id: string }).id;
    const isConverted = (dealData as { isConverted?: boolean; convertedOpportunity?: boolean }).isConverted || (dealData as { convertedOpportunity?: boolean }).convertedOpportunity;
    const isLoading = convertingIds?.has(id);

    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-[29px] h-[29px] bg-[#C81C1F] rounded-lg">
            <img src="/icons/project/tags.svg" alt="Convert to opportunity" className="w-4 h-4" />
          </div>
          <label className="text-sm font-medium text-gray-700">Convert to Opportunity</label>
        </div>

        {isConverted ? (
          <div className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded border border-gray-300 w-full text-center">
            <span className="italic">Already Converted</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={async () => {
              if (!onConvertToOpportunity) return;
              await onConvertToOpportunity(id);
            }}
            disabled={isLoading}
            className={`px-4 py-2 text-sm text-white rounded transition-colors w-full text-center ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#C81C1F] hover:bg-[#a01618]'}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Converting...</span>
              </div>
            ) : (
              'Convert to Opportunity'
            )}
          </button>
        )}

        <p className="text-xs text-gray-500 mt-1">{isConverted ? 'This lead has already been converted to an opportunity' : 'Convert this lead to an opportunity in the system'}</p>
      </div>
    );
  }

  if (fieldKey === 'createLead') {
    const id = dealData && typeof dealData === 'object' && 'id' in dealData ? (dealData as { id: string }).id : undefined;
    const loading = id ? convertingIds?.has(id) : false;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-[29px] h-[29px] bg-[#C81C1F] rounded-lg">
            <img src="/icons/project/tags.svg" alt="Convert to Lead" className="w-4 h-4" />
          </div>
          <label className="text-sm font-medium text-gray-700">Convert to Lead</label>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!id || !onConvertToLead) return;
            await onConvertToLead(id);
          }}
          disabled={!id || loading}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#C81C1F' }}
        >
          {loading ? 'Converting...' : 'Move To Lead'}
        </button>
        <p className="text-xs text-gray-500 mt-1">Convert this contact to a lead in the system</p>
      </div>
    );
  }

  if (fieldKey === 'createDeal') {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-[29px] h-[29px] bg-[#C81C1F] rounded-lg">
            <span className="text-white text-sm">💰</span>
          </div>
          <label className="text-sm font-medium text-gray-700">Create Deal</label>
        </div>
        <button
          type="button"
          onClick={() => onLinkOpportunity?.(dealData)}
          className="px-4 py-2 text-sm bg-[#C81C1F] text-white rounded transition-colors w-full text-center"
        >
          Create Deal
        </button>
        <p className="text-xs text-gray-500 mt-1">Create and manage deals for this opportunity</p>
      </div>
    );
  }

  if (fieldKey === 'linkOpportunity') {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-[29px] h-[29px] bg-[#C81C1F] rounded-lg">
            <span className="text-white text-sm">🔗</span>
          </div>
          <label className="text-sm font-medium text-gray-700">Link Opportunity</label>
        </div>
        <button
          type="button"
          onClick={() => onLinkOpportunity?.(dealData)}
          className="px-4 py-2 text-sm bg-[#C81C1F] text-white rounded transition-colors w-full text-center"
        >
          Link Opportunity
        </button>
        <p className="text-xs text-gray-500 mt-1">Link opportunities to this deal</p>
      </div>
    );
  }

  /* -------- Normal fields ----------------------------------------- */
  const fieldId = `field-${fieldKey}`;

  if (fieldKey === 'tags' || fieldKey === 'contactGroup') {
    return (
      <Controller
        name={fieldKey}
        control={control}
        rules={rules}
        render={({ field: { onChange, value } }) => (
          <TagsAndContactGroup
            field={field as any}
            fieldKey={fieldKey}
            control={control}
            errors={errors as any}
            isRequired={isRequired}
            rules={rules}
            options={{
              allowMultiple: options?.allowMultiple ?? true,
              allowCustomTags: options?.allowCustomTags ?? true,
              choices: (options?.choices as Choice[]) || [],
            }}
          />
        )}
      />
    );
  }

  // In FormFieldRenderer.tsx, update the accountManager section:
  if (fieldKey === 'assignedTo' || fieldKey === 'accountManager' || fieldKey === 'owner' || fieldKey === 'assignTo' || fieldKey === 'team' || fieldKey === 'manager') {
    return (
      <FieldWrapper field={field} error={!!errors[fieldKey]} required={isRequired}>
        <Controller
          name={fieldKey}
          control={control}
          rules={rules}
          render={({ field: { onChange, value } }) => {
            // Get user options from field API choices instead of companyUsersData
            const userOptionsFromField = ((options?.choices as any[]) || []).map((choice: any) => ({
              id: choice.value,
              firstName: choice.firstName || '',
              lastName: choice.lastName || '',
              email: choice.label || '',
              role: choice.role || '',
              avatar: choice.avatar || ''
            }));

            // If no choices in field API, fallback to company users
            const userOptions = userOptionsFromField.length > 0
              ? userOptionsFromField
              : (companyUsersData?.users || []).map((user: unknown) => {
                const u = user as {
                  id: string;
                  firstName?: string;
                  lastName?: string;
                  email: string;
                  role?: string | { name?: string };
                  avatar?: string;
                };
                return {
                  id: u.id,
                  firstName: u.firstName || '',
                  lastName: u.lastName || '',
                  email: u.email,
                  role: u.role,
                  avatar: u.avatar
                };
              });

            // Transform current value for UserDropdown
            let currentValue = null;
            if (value) {
              if (typeof value === 'string') {
                // If value is string ID, find the user object
                currentValue = userOptions.find(user => user.id === value) || null;
              } else if (typeof value === 'object' && value !== null) {
                // If value is already a user object
                const userObj = value as { id?: string; firstName?: string; lastName?: string; email?: string };
                if (userObj.id) {
                  currentValue = {
                    id: userObj.id,
                    firstName: userObj.firstName || '',
                    lastName: userObj.lastName || '',
                    email: userObj.email || '',
                    role: '',
                    avatar: ''
                  };
                }
              }
            }

            return (
              <UserDropdown
                value={currentValue}
                onChange={(selectedUser) => {
                  // Send only the user ID to the form
                  onChange(selectedUser ? (Array.isArray(selectedUser) ? selectedUser[0]?.id : selectedUser.id) : null);
                }}
                options={userOptions}
                placeholder={options?.placeholder as string || `Select ${displayName}`}
                multiple={false}
                error={!!errors[fieldKey]}
                disabled={isReadOnly}
              />
            );
          }}
        />
        <ErrorMessage
          errors={errors}
          name={fieldKey}
          render={({ message }) => (
            <FormHelperText error className="text-sm mt-1">
              {message}
            </FormHelperText>
          )}
        />
      </FieldWrapper>
    );
  }

  if (fieldKey === 'createdBy') {
    return (
      <FieldWrapper field={field} error={!!errors[fieldKey]} required={isRequired}>
        <Controller
          name={fieldKey}
          control={control}
          rules={rules}
          render={({ field: { onChange, value } }) => {
            // Use current user data for createdBy field


            const currentUserName = currentUser
              ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
              : 'Current User';

            // For display purposes, show the user's name
            // But store the user ID as the value
            return (
              <TextField
                value={currentUserName}
                fullWidth
                variant="outlined"
                disabled={true} // This field should be read-only
                placeholder="Auto-populated with current user"
                sx={{
                  ...textFieldStyles,
                  '& .MuiOutlinedInput-root': {
                    ...textFieldStyles['& .MuiOutlinedInput-root'],
                    backgroundColor: '#f5f5f5',
                    '&.Mui-disabled': {
                      backgroundColor: '#f5f5f5',
                      color: 'rgba(0, 0, 0, 0.6)'
                    }
                  }
                }}
                InputProps={{
                  readOnly: true,
                }}
              />
            );
          }}
        />
        <ErrorMessage
          errors={errors}
          name={fieldKey}
          render={({ message }) => (
            <FormHelperText error className="text-sm mt-1">
              {message}
            </FormHelperText>
          )}
        />
      </FieldWrapper>
    );
  }

  /* -------- Normal dropdown (MUI Select) -------------------------- */
  if (fieldType === 'DROPDOWN' && useNormalDropdown) {
    return (
      <FieldWrapper field={field} error={!!errors[fieldKey]} required={isRequired}>
        <FormControl fullWidth error={!!errors[fieldKey]}>
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: { onChange, value } }) => (
              <Select
                value={(value as string) || ''}
                onChange={onChange}
                disabled={isReadOnly}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '&:hover fieldset': { borderColor: '#d1d5db' },
                    '&.Mui-focused fieldset': { borderColor: '#C81C1F', borderWidth: '2px' },
                    '&.Mui-error fieldset': { borderColor: '#ef4444' },
                  },
                  '& .MuiSelect-select': { padding: '12px 14px', fontSize: '0.875rem', backgroundColor: '#f9fafb' },
                }}
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 200,
                      marginTop: 1,
                      '& .MuiMenuItem-root': {
                        padding: '8px 16px',
                        fontSize: '0.875rem',
                        '&:hover': { backgroundColor: '#fef2f2' },
                        '&.Mui-selected': { backgroundColor: '#fecaca', '&:hover': { backgroundColor: '#fecaca' } },
                      },
                    },
                  },
                }}
                renderValue={(selected) => {
                  if (!selected) return <span className="text-gray-400">{options?.placeholder || `Select ${displayName}`}</span>;
                  const choice = (options?.choices as Choice[])?.find((c) => (typeof c === 'string' ? c === selected : c.value === selected));
                  const display = typeof choice === 'string' ? choice : choice?.label || choice?.displayName || selected;
                  return <span className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{display}</span>;
                }}
              >
                <MenuItem value="">
                  <span className="text-gray-400">{options?.placeholder || `Select ${displayName}`}</span>
                </MenuItem>
                {(options?.choices as Choice[])?.map((choice, idx) => {
                  const val = typeof choice === 'string' ? choice : choice.value;
                  const label = typeof choice === 'string' ? choice : choice.label || choice.displayName || val;
                  return (
                    <MenuItem key={idx} value={val}>
                      {label}
                    </MenuItem>
                  );
                })}
              </Select>
            )}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FormControl>
      </FieldWrapper>
    );
  }

  /* -------- StatusDropdown (custom) ------------------------------- */
  if (fieldType === 'DROPDOWN') {
    return (
      <FieldWrapper field={field} error={!!errors[fieldKey]} required={isRequired}>
        <Controller
          name={fieldKey}
          control={control}
          rules={rules}
          render={({ field: { onChange, value } }) => {
            const dropdownOptions = ((options?.choices as Choice[]) || [])
              .filter((ch) => (typeof ch === 'object' ? ch.isActive !== false : true))
              .map((ch) => {
                const key = typeof ch === 'string' ? ch : ch.value!;
                const display = typeof ch === 'string' ? ch : ch.label || ch.displayName || key;
                const color = typeof ch === 'string' ? '#6b7280' : ch.color || '#6b7280';
                return { fieldKey: key, displayName: display, color };
              });

            const currentValue = typeof value === 'object' && value !== null && 'value' in value ? (value as { value: string }).value : (value as string);
            const currentDisplay = typeof value === 'object' && value !== null && 'label' in value ? (value as { label: string }).label : (value as string);

            return (
              <div className="dropdown-height-fix">
                <StatusDropdown
                  currentStatus={currentDisplay || currentValue || ''}
                  options={dropdownOptions}
                  onStatusChange={(newValue) => {
                    const opt = dropdownOptions.find((o) => o.fieldKey === newValue || o.displayName === newValue);
                    onChange(opt ? opt.fieldKey : newValue);
                  }}
                  onUpdateOption={async (choiceKey, updates) => {
                    if (onUpdateDropdownOption && field.fieldId) await onUpdateDropdownOption(field.fieldId, choiceKey, updates);
                  }}
                  onAddOption={async (opt) => {
                    if (onAddDropdownOption && field.fieldId) await onAddDropdownOption(field.fieldId, opt);
                  }}
                  onDeleteOption={async (choiceKey) => {
                    if (onDeleteDropdownOption && field.fieldId) await onDeleteDropdownOption(field.fieldId, choiceKey);
                  }}
                  onReorderOptions={async (ordered) => {
                    if (onReorderDropdownOptions && field.fieldId) await onReorderDropdownOptions(field.fieldId, ordered);
                  }}
                  fullWidth
                  className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center border border-gray-300 focus:border-[#C81C1F] focus:ring-2 focus:ring-[#C81C1F] transition-colors"
                  disabled={isReadOnly}
                />
              </div>
            );
          }}
        />
        <ErrorMessage
          errors={errors}
          name={fieldKey}
          render={({ message }) => (
            <FormHelperText error className="text-sm mt-1">
              {message}
            </FormHelperText>
          )}
        />
      </FieldWrapper>
    );
  }

  /* -------- Text / Email / Phone / URL / TextArea / Number / Currency / Date */
  const renderInputField = () => {
    switch (fieldType) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <TextField
            {...register(fieldKey, rules)}
            type={fieldType === 'EMAIL' ? 'email' : fieldType === 'PHONE' ? 'tel' : 'text'}
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            placeholder={options?.placeholder}
            disabled={isReadOnly}
            sx={textFieldStyles}
          />
        );
      case 'TEXTAREA':
        return (
          <TextField
            {...register(fieldKey, rules)}
            fullWidth
            multiline
            rows={options?.rows || 4}
            variant="outlined"
            error={!!errors[fieldKey]}
            placeholder={options?.placeholder}
            disabled={isReadOnly}
            sx={textAreaStyles}
          />
        );
      case 'NUMBER':
      case 'CURRENCY':
        return (
          <TextField
            {...register(fieldKey, { ...rules, valueAsNumber: true })}
            type="number"
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            disabled={isReadOnly}
            sx={textFieldStyles}
            InputProps={{
              startAdornment: fieldType === 'CURRENCY' ? <span className="mr-2 text-gray-500">$</span> : undefined,
            }}
          />
        );
      case 'DATE':
        return (
          <TextField
            {...register(fieldKey, rules)}
            type="date"
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            InputLabelProps={{ shrink: true }}
            disabled={isReadOnly}
            sx={textFieldStyles}
          />
        );
      default:
        return (
          <TextField
            {...register(fieldKey, rules)}
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            placeholder={`Enter ${displayName}`}
            disabled={isReadOnly}
            sx={textFieldStyles}
          />
        );
    }
  };

  return (
    <FieldWrapper field={field} error={!!errors[fieldKey]} required={isRequired}>
      {renderInputField()}
      <ErrorMessage
        errors={errors}
        name={fieldKey}
        render={({ message }) => (
          <FormHelperText error className="text-sm mt-1">
            {message}
          </FormHelperText>
        )}
      />
    </FieldWrapper>
  );
};