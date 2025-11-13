'use client';

import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
    isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "Do you really want to delete this record permanently?",
    itemName,
    isDeleting = false
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isDeleting) {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!isDeleting) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        if (!isDeleting) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-scale-in">
                {/* Icon */}
                <div className="flex justify-center pt-8 pb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C81C1F' }}>
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-semibold text-center mb-4 px-6" style={{ color: '#656462' }}>
                    {title}
                </h2>

                {/* Message */}
                <div className="px-6 pb-6">
                    <p className="text-center mb-2" style={{ color: '#8F8E8C' }}>
                        {message}
                    </p>
                    {itemName && (
                        <p className="text-center font-semibold" style={{ color: '#656462' }}>
                            &quot;{itemName}&quot;
                        </p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 px-6 pb-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#8F8E8C', color: '#ffffff' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#C81C1F' }}
                    >
                        {isDeleting ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default DeleteConfirmationModal;
