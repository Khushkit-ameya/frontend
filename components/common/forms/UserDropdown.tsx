import React, { useState, useRef, useEffect } from "react";
import { Search, User as UserIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { User } from "@/components/common/forms/DynamicForm/types";

interface UserDropdownProps {
    value: User[] | User | null;
    onChange: (value: User[] | User | null) => void;
    options: User[];
    placeholder?: string;
    multiple?: boolean;
    error?: boolean;
    disabled?: boolean;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
    value,
    onChange,
    options,
    placeholder = "",
    multiple = false,
    error = false,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // normalize selected users as an array for easier manipulation
    const selectedUsers: User[] = multiple
        ? (Array.isArray(value) ? value : [])
        : value && !Array.isArray(value)
            ? [value]
            : [];

    // filter options based on search
    const filteredOptions = options.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    // outside click closes dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isUserSelected = (user: User) =>
        selectedUsers.some((u) => u.id === user.id);

    const toggleSelect = (user: User) => {
        if (multiple) {
            const already = isUserSelected(user);
            if (already) {
                onChange(selectedUsers.filter((u) => u.id !== user.id));
            } else {
                onChange([...selectedUsers, user]);
            }
            // keep dropdown open for multi-select
        } else {
            onChange(user);
            setIsOpen(false);
            setSearchTerm("");
        }
    };

    const removeUser = (userId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (multiple) {
            onChange(selectedUsers.filter((u) => u.id !== userId));
        } else {
            onChange(null);
        }
    };

    // avatar renderer (small/medium) — filled for selected (red), black default when not selected in trigger
    const Avatar = ({ user, size = "md", filled = false }: { user: User; size?: "sm" | "md" | "lg"; filled?: boolean }) => {
        const dim = size === "sm" ? 24 : size === "md" ? 32 : 40;
        const borderColor = filled ? "border-gray-600" : "border-gray-300";
        const iconColor = filled ? "text-red-600" : "text-gray-600";

        return (
            <div
                className={`rounded-full overflow-hidden border ${borderColor} bg-white flex items-center justify-center`}
                style={{ width: dim, height: dim }}
            >
                {user.avatar ? (
                    <Image
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={dim}
                        height={dim}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <UserIcon size={dim * 0.6} className={iconColor} />
                )}
            </div>
        );
    };

    // Updated renderTrigger function in UserDropdown component
    const renderTrigger = () => {
        if (!multiple && selectedUsers.length === 0) {
            return (
                <div className="flex items-center justify-center w-full">
                    <div className="rounded-full border border-gray-300 p-1">
                        <Plus size={16} />
                    </div>
                </div>
            );
        }

        // render plus + avatars for multi or single selected
        const avatarsToShow = selectedUsers.slice(0, 3);
        const remaining = Math.max(0, selectedUsers.length - 3);
        return (
            <div className="w-full flex items-center justify-center gap-2">
                {/* Plus icon */}
                <div className="rounded-full border border-gray-300 p-1">
                    <Plus size={16} />
                </div>

                {/* Avatars */}
                <div className="flex items-center gap-1">
                    {avatarsToShow.map((u, idx) => (
                        <div
                            key={u.id}
                            className="relative"
                            style={{
                                marginLeft: idx === 0 ? 0 : -16,
                                zIndex: idx,
                            }}
                            onMouseEnter={() => setHoveredId(u.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <div className="cursor-pointer bg-white">
                                <Avatar user={u} size="md" filled={true} />
                            </div>

                            {/* Hover card */}
                            {hoveredId === u.id && (
                                <div className="absolute left-1/2 -translate-x-1/2 -top-20 z-50 
                                w-max bg-white border border-gray-300 
                                shadow-lg rounded-md p-1">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={u} size="lg" filled={true} />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {u.firstName} {u.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {u.email}
                                            </div>
                                            {u.role && (
                                                <div className="mt-2 inline-block bg-green-50 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                                    {typeof u.role === "string" ? u.role : u.role?.name || "Team Member"}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    ))}

                    {remaining > 0 && (
                        <div className="rounded-full bg-gray-100 text-gray-700 text-xs px-2 py-1">
                            +{remaining}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger */}
            <div
                onClick={() => !disabled && setIsOpen((s) => !s)}
                className={`w-full min-h-[48px] rounded-[8px] items-center px-3 py-2 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-pointer flex justify-center gap-2 ${error ? "border-red-500" : ""
                    } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}`}
            >
                {(multiple && selectedUsers.length === 0) || (!multiple && selectedUsers.length === 0)
                    ? renderTrigger()
                    : renderTrigger()
                }
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-lg max-h-72 overflow-auto rounded">
                    {/* Selected chips shown below the search input */}
                    {selectedUsers.length > 0 && (
                        <div className="p-2 border-b border-gray-100 dark:border-gray-600 flex flex-wrap gap-2">
                            {selectedUsers.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 text-sm"
                                >
                                    <div className="flex-shrink-0">
                                        <Avatar user={u} size="sm" filled={true} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-gray-800 dark:text-gray-200 truncate">
                                            {u.firstName} {u.lastName}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => removeUser(u.id, e)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-red-50"
                                        title="Remove"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Search on top (sticky) */}
                    <div className="sticky top-0 bg-white dark:bg-gray-700 p-2 border-b border-gray-200 dark:border-gray-600 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search name, role or email"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 pl-9 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                            />
                        </div>
                    </div>



                    {/* Suggested label (optional) */}
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white">Suggested people</div>

                    {/* List */}
                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">No users found</div>
                        ) : (
                            filteredOptions.map((user) => {
                                const selected = isUserSelected(user);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleSelect(user)}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${selected ? " dark:bg-red-900/20" : ""
                                            }`}
                                    >
                                        {/* circle border avatar */}
                                        <div
                                            className={`rounded-full border border-black overflow-hidden`}
                                            style={{ width: 32, height: 32 }}
                                        >
                                            {user.avatar ? (
                                                <Image
                                                    src={user.avatar}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full bg-white text-black">
                                                    <UserIcon size={18} className="text-gray-600" />
                                                </div>
                                            )}
                                        </div>


                                        {/* user info - UPDATED TO INCLUDE ROLE */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-300">
                                                {user.email}
                                            </div>
                                            {/* ADD THIS: Role badge */}
                                            {/* {user.role && (
                                                <div className="mt-1 inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
                                                    {user.role}
                                                </div>
                                            )} */}

                                            {user.role && (
                                                <div className="mt-1 inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
                                                    {typeof user.role === 'string' ? user.role : user.role?.name || 'Team Member'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
