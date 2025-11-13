"use client";
import React from "react";
import { XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 w-[320px] text-center"
      >
        <XCircle size={48} className="text-red-500 mx-auto mb-3" />

        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Are you sure?
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Do you really want to delete this record permanently?
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;
