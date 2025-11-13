import React, { useState, useRef, useEffect } from 'react';
import { Controller, Control, FieldError, FieldValues } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { ErrorMessage } from '@hookform/error-message';
import { FormHelperText } from '@mui/material';
import { FieldWrapper } from '../BizAccelerator/DynamicForm/FieldWrapper';

interface Tag {
  value: string;
  label: string;
  color?: string;
}

interface ChoiceOption {
  value: string | number;
  label: string;
  color?: string;
}

interface FieldDefinition {
  fieldKey: string;
  displayName: string;
  fieldType: string;
  [key: string]: unknown;
}

interface TagsAndContactGroupProps {
  field: FieldDefinition;
  fieldKey: string;
  control: Control<FieldValues>;
  errors: Record<string, FieldError>;
  isRequired?: boolean;
  rules?: Record<string, unknown>;
  options?: {
    allowMultiple?: boolean;
    allowCustomTags?: boolean;
    choices?: (string | number | ChoiceOption)[];
  };
}

export const TagsAndContactGroup: React.FC<TagsAndContactGroupProps> = ({
  field,
  fieldKey,
  control,
  errors,
  isRequired = false,
  rules,
  options = {}
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allowMultiple = options?.allowMultiple ?? true;
  const allowCustom = options?.allowCustomTags ?? true;
  const predefinedOptions = options?.choices || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <FieldWrapper field={field as any} error={!!errors[fieldKey]} required={isRequired}>
      <Controller
        name={fieldKey}
        control={control}
        rules={rules}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          // Normalize current value to array
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];

          // Filter options based on input
          const filteredOptions = predefinedOptions.filter((choice: string | number | ChoiceOption) => {
            const choiceLabel = typeof choice === 'object' ? choice.label : String(choice);
            return choiceLabel.toLowerCase().includes(inputValue.toLowerCase());
          });

          // Add tag function
          const addTag = (tagValue: string, tagLabel?: string, tagColor?: string) => {
            const newTag = {
              value: tagValue,
              label: tagLabel || tagValue,
              color: tagColor || '#D9D9D980'
            };

            const newValues = allowMultiple ? [...currentValues, newTag] : [newTag];
            onChange(newValues);
            setInputValue('');
            setIsDropdownOpen(false);
          };

          // Remove tag function
          const removeTag = (index: number) => {
            const newValues = currentValues.filter((_, i) => i !== index);
            onChange(allowMultiple ? newValues : []);
          };

          // Handle input key events
          const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const trimmedValue = inputValue.trim();

              if (trimmedValue) {
                // Check if it matches any predefined option
                const matchingOption = predefinedOptions.find((option: string | number | ChoiceOption) => {
                  const optionLabel = typeof option === 'object' ? option.label : String(option);
                  return optionLabel.toLowerCase() === trimmedValue.toLowerCase();
                });

                if (matchingOption) {
                  // Use the predefined option
                  const optionValue = typeof matchingOption === 'object' ? matchingOption.value : matchingOption;
                  const optionLabel = typeof matchingOption === 'object' ? matchingOption.label : String(matchingOption);
                  const optionColor = typeof matchingOption === 'object' ? matchingOption.color : undefined;

                  addTag(String(optionValue), optionLabel, optionColor);
                } else if (allowCustom) {
                  // Add as custom tag
                  addTag(trimmedValue);
                }
              }
            } else if (e.key === 'Backspace' && !inputValue && currentValues.length > 0) {
              // Remove last tag on backspace
              removeTag(currentValues.length - 1);
            }
          };

          return (
            <div className="space-y-2 relative" ref={dropdownRef}>
              {/* Tags container with input */}
              <div
                className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-md cursor-text min-h-[52px] bg-white focus-within:ring-2 focus-within:ring-[#C81C1F] focus-within:border-[#C81C1F] transition-colors"
                onClick={() => inputRef.current?.focus()}
              >
                {/* Selected tags - always with gray-300 background */}
                {currentValues.map((tag: Tag | string, index: number) => {
                  const tagLabel = typeof tag === 'object' ? tag.label : String(tag);

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-300 border border-gray-400"
                    >
                      <span className="text-xs font-medium text-gray-800">{tagLabel}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(index);
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-400 transition-colors text-gray-600 hover:text-gray-800"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* Input field */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={currentValues.length === 0 ? "Type and press Enter to add..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent focus:outline-none px-1 py-1 text-sm text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Dropdown for predefined options - with colors */}
              {isDropdownOpen && (filteredOptions.length > 0 || (allowCustom && inputValue.trim())) && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {/* Predefined options */}
                  {filteredOptions.map((option: string | number | ChoiceOption, index: number) => {
                    const optionValue = typeof option === 'object' ? option.value : option;
                    const optionLabel = typeof option === 'object' ? option.label : String(option);
                    const optionColor = typeof option === 'object' ? option.color : undefined;

                    // Check if already selected
                    const isSelected = currentValues.some((tag: Tag | string) =>
                      (typeof tag === 'object' ? tag.value : tag) === optionValue
                    );

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!isSelected) {
                            addTag(String(optionValue), optionLabel, optionColor);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-700 flex items-center justify-between ${isSelected ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Color indicator in dropdown only */}
                          {optionColor && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: optionColor }}
                            />
                          )}
                          <span>{optionLabel}</span>
                        </div>
                        {isSelected && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom option */}
                  {allowCustom && inputValue.trim() && !filteredOptions.some((option: string | number | ChoiceOption) => {
                    const optionLabel = typeof option === 'object' ? option.label : String(option);
                    return optionLabel.toLowerCase() === inputValue.trim().toLowerCase();
                  }) && (
                      <button
                        type="button"
                        onClick={() => addTag(inputValue.trim())}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-700 flex items-center gap-2 border-t border-gray-200"
                      >
                        <Plus size={16} />
                        Add &quot;{inputValue.trim()}&quot;
                      </button>
                    )}

                  {/* No results message */}
                  {filteredOptions.length === 0 && !inputValue.trim() && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No options available
                    </div>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <FormHelperText error className="text-sm mt-1">
                  {error.message}
                </FormHelperText>
              )}
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
};