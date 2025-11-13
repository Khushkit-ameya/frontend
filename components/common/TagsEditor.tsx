"use client";
import React, { useState, useRef } from 'react';
import { Popover, TextField, Button } from '@mui/material';
import { Edit, X, Add } from '@mui/icons-material';
import { DateTime } from 'luxon';
import { IoIosClose } from "react-icons/io";
interface TagsEditorProps {
    currentValue: string[];
    onTagsChange: (newTags: string[]) => Promise<void>;
    disabled?: boolean;
    className?: string;
}

export const TagsEditor: React.FC<TagsEditorProps> = ({
    currentValue = [],
    onTagsChange,
    disabled = false,
    className = ""
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tags, setTags] = useState<string[]>(currentValue);
    const [newTagInput, setNewTagInput] = useState('');
    const clickRef = useRef<HTMLDivElement>(null);

    const isOpen = Boolean(anchorEl);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!disabled && !isLoading) {
            setTags([...currentValue]); // Reset to current values when opening
            setAnchorEl(e.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
        setNewTagInput('');
    };

    const handleAddTag = () => {
        const trimmedTag = newTagInput.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleUpdate = async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        try {
            await onTagsChange(tags);
            handleClose();
        } catch (error) {
            console.error('Failed to update tags:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const renderTagsDisplay = () => {
        if (!currentValue || currentValue.length === 0) {
            return (
                <div
                    ref={clickRef}
                    className={`flex items-center gap-2 px-2 py-1 border border-dashed border-gray-300 rounded-full cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
                    onClick={handleClick}
                    title="Click to add tags"
                >
                    <span className="text-sm text-gray-500">Add tags</span>
                    <Edit className="w-3 h-3 text-gray-400" />
                </div>
            );
        }

        return (
            <div
                ref={clickRef}
                className={`flex flex-wrap gap-1 items-center justify-between ${className}`}
            >
                <div>
                    {currentValue.map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                            {tag},
                        </span>
                    ))}
                </div>
                <div
                    className="flex items-center justify-center w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors"
                    onClick={handleClick}
                    title="Edit tags"
                >
                    {/* <Edit className="w-3 h-3 text-gray-600" /> */}
                    <img src="/editsss.svg" alt="Tags Icon" className="w-4 h-4" />

                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-1 items-center">
                {currentValue.map((tag, index) => (
                    <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full opacity-50"
                    >
                        {tag}
                    </span>
                ))}
                <div className="text-xs text-gray-500 ml-2">Updating...</div>
            </div>
        );
    }

    return (
        <div className="relative ">
            {renderTagsDisplay()}

            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    style: {
                        marginTop: 8,
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        minWidth: 300,
                    }
                }}
                className=''
            >
                <div className=" bg-gray-100 border border-gray-300 rounded-lg">
                    <div className="mb-3 bg-[#656462] py-2 rounded-t-lg text-white px-4 flex justify-between items-center">
                        <h3 className="text-sm font-semibold ">Tags Update</h3>
                        <div className="flex justify-end bg-gray-200 rounded-md">
                            <button
                                type="button"
                                onClick={handleClose}
                                title="Close"
                                className="p-[1px] rounded hover:bg-white/10 transition-colors"
                                aria-label="Close tags editor"
                            >
                                <IoIosClose size={24} color='black' />
                            </button>
                        </div>
                    </div>

                    <div className="mb-3 p-2">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex gap-2">
                            <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Type Here.."
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 focus:border-[#5f5e5c] focus:border-[1px] rounded-md hover:border-[#5f5e5c]"
                                InputProps={{
                                    style: { fontSize: '12px' }
                                }}
                            />
                            <Button
                                size="small"
                                // variant="contained"
                                onClick={handleAddTag}
                                disabled={!newTagInput.trim() || tags.includes(newTagInput.trim())}
                                style={{
                                    minWidth: '32px',
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: 'none'
                                }}
                            >
                                <Add className="w-4 h-4 text-[#1c75bb]" />
                            </Button>
                        </div>
                    </div>

                    {/* Current Tags Display */}
                    <div className="mb-4 px-2">
                        <div className="flex flex-wrap gap-2 items-center">
                            {tags.map((tag, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 px-3 py-1 bg-gray-300 text-[#656462] text-xs rounded-full "
                                >
                                    <span className="text-sm">{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-purple-100 transition-colors"
                                        title="Remove tag"
                                    >
                                        <IoIosClose size={14} />
                                    </button>
                                </div>
                            ))}
                            {tags.length === 0 && (
                                <div className="text-xs text-gray-500 italic">No tags added yet</div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-start px-2 mb-3">
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleUpdate}
                            disabled={isLoading}
                            style={{
                                backgroundColor: '#e7000b',
                                color: 'white',
                                fontSize: '11px',
                                padding: '4px 12px',
                                textTransform: 'none'
                            }}
                        >
                            {isLoading ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </div>
            </Popover>
        </div>
    );
};

export default TagsEditor;