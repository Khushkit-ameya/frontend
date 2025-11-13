"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  MoreVertical,
  Grid,
  List,
  Download,
  Link as LinkIcon,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  ChevronLeft,
  ChevronRight,
  Printer,
  Trash2,
} from "lucide-react";
import Image from "next/image";

/* -----------------------
   Inline UI Components
----------------------- */

const Input = ({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

const Button = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "md" | "icon";
}) => {
  const base =
    "rounded-md font-medium flex items-center justify-center transition-colors";
  const variants: Record<string, string> = {
    default: "bg-[#C81C1F] text-white hover:bg-[#C81C1F]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  const sizes: Record<string, string> = {
    md: "px-4 py-2 text-sm",
    icon: "p-2",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

type DialogSize = "sm" | "md" | "lg";

const sizeClasses: Record<DialogSize, string> = {
  sm: "w-[620px] h-auto",
  md: "w-[700px] h-[70vh]",
  lg: "w-[90vw] h-[85vh]",
};

const Dialog = ({
  open,
  onOpenChange,
  children,
  size = "lg", // default
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  size?: DialogSize;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`bg-white rounded-lg shadow-lg p-6 relative ${sizeClasses[size]}`}>
        {children}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={() => onOpenChange(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};


const DialogContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2">{children}</div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-center">{children}</h2>
);

// Dropdown with toggle
const DropdownMenu = ({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownMenuItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
    onClick={onClick}
  >
    {children}
  </div>
);

/* -----------------------
   File Type Utilities
----------------------- */

const getFileIcon = (fileType: string, className: string = "w-8 h-8") => {
  if (fileType === "link") return <LinkIcon className={className} />;
  if (fileType.includes("image")) return <ImageIcon className={className} />;
  if (fileType.includes("pdf")) return <FileText className={className} />;
  if (fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType.includes("xls")) return <FileSpreadsheet className={className} />;
  return <File className={className} />;
};

const isOfficeFile = (fileName: string) => {
  return /\.(xls|xlsx|doc|docx|ppt|pptx)$/i.test(fileName);
};

const isPdfFile = (fileName: string) => {
  return /\.pdf$/i.test(fileName);
};

const isImageFile = (fileType: string) => {
  return fileType.includes("image");
};

/* -----------------------
   Main Component
----------------------- */

interface FileItem {
  id: string;
  name: string;
  type: string;
  url?: string;
  preview?: string;
  uploadedAt: Date;
  file?: File; // Store the actual file object for better handling
}

export const FilesLinksTabContent: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const uploaded = Array.from(event.target.files).map((file) => ({
        id: Date.now() + file.name,
        name: file.name,
        type: file.type,
        preview: URL.createObjectURL(file),
        uploadedAt: new Date(),
        file: file, // Store the file object
      }));
      setFiles((prev) => [...prev, ...uploaded]);
    }
  };

  const handleAddLink = () => {
    if (linkUrl && linkText) {
      setFiles((prev) => [
        ...prev,
        {
          id: Date.now() + linkText,
          name: linkText,
          type: "link",
          url: linkUrl,
          uploadedAt: new Date(),
        },
      ]);
      setLinkUrl("");
      setLinkText("");
      setIsLinkModalOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((file) => file.id !== id);
    });
    if (previewIndex !== null) {
      setPreviewIndex(null);
    }
  };

  const handlePrev = () => {
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const handleNext = () => {
    if (previewIndex !== null && previewIndex < files.length - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  const handleDownload = (file: FileItem) => {
    if (file.type === "link" && file.url) {
      window.open(file.url, "_blank");
      return;
    }

    if (file.preview) {
      const link = document.createElement("a");
      link.href = file.preview;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFilePreview = (file: FileItem) => {
    if (file.type === "link") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <LinkIcon className="w-16 h-16 text-blue-500 mb-4" />
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all text-center px-4"
          >
            {file.url}
          </a>
        </div>
      );
    }

    if (isImageFile(file.type)) {
      return (
        <img
          src={file.preview}
          alt={file.name}
          className="max-h-full max-w-full object-contain"
        />
      );
    }

    if (isPdfFile(file.name) && file.preview) {
      return (
        <iframe
          src={file.preview}
          title={file.name}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      );
    }

    if (isOfficeFile(file.name) && file.preview) {
      // Use Microsoft Office Online Viewer for Office files
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.preview)}`;
      return (
        <iframe
          src={officeViewerUrl}
          title={file.name}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-full">
        {getFileIcon(file.type, "w-16 h-16 text-gray-400")}
        <p className="mt-4 text-gray-600">Preview not available for this file type</p>
        <Button
          className="mt-4"
          onClick={() => handleDownload(file)}
        >
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4 border border-[#0000004F] rounded-lg bg-white h-[95vh] overflow-y-auto">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-4 gap-2">
        {/* Add File + Link */}
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-[#C81C1F] text-white rounded-md cursor-pointer">
            + Add File
            <input type="file" multiple hidden onChange={handleFileUpload} />
          </label>
          <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>
            <LinkIcon className="w-4 h-4 mr-2" /> Link
          </Button>
          {/* Search bar */}
          <Input placeholder="Search for files" className="flex-1 max-w-sm" />
        </div>

        {/* View / Download buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setView("grid")}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setView("list")}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Upload section if no files */}
      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <Image
            src="/icons/project/Filelinks.svg"
            alt="No files"
            width={540}
            height={540}
            className="mb-2"
          />
          <p className="text-gray-500 text-2xl">Drag & drop or add files here</p>
          <p className="text-gray-500 mt-3">Upload, comment and review all files in this item to easily collaborate in content</p>
          <label className="px-4 py-2 bg-[#C81C1F] text-white rounded-md cursor-pointer mt-4">
            + Add File
            <input type="file" multiple hidden onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* File list header */}
      {files.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <span>Showing {files.length} out of {files.length} files</span>
          </div>

          {/* File gallery */}
          <div
            className={
              view === "grid" ? "grid grid-cols-3 gap-4" : "space-y-2"
            }
          >
            {files.map((file, i) => (
              <div
                key={file.id}
                className="relative border rounded-md p-3 flex items-center gap-3"
              >
                {file.type === "link" ? (
                  <LinkIcon className="w-8 h-8 text-blue-500" />
                ) : (
                  <div
                    className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded cursor-pointer"
                    onClick={() => setPreviewIndex(i)}
                  >
                    {getFileIcon(file.type, "w-8 h-8 text-gray-600")}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded on {file.uploadedAt.toLocaleDateString()} at {file.uploadedAt.toLocaleTimeString()}
                  </p>
                </div>

                {/* Dropdown */}
                <DropdownMenu
                  trigger={
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  }
                >
                  <DropdownMenuItem onClick={() => setPreviewIndex(i)}>
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>Replace</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(file.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Link Upload Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload file from link</DialogTitle>
          </DialogHeader>

          {/* Centered Image */}
          <div className="flex justify-center mb-4">
            <Image
              src="/icons/project/link-choosing-asset.svg"
              alt="No files"
              width={420}
              height={420}
            />
          </div>

          {/* Form */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste any type of link
            </label>
            <Input
              placeholder="e.g. (pdf, adobe, miro, figma..)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="mb-3 w-full"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text to display
            </label>
            <Input
              placeholder="(e.g. Design file V1)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="mb-4 w-full"
            />

            {/* Save button aligned right */}
            <div className="flex justify-end ">
              <Button onClick={handleAddLink}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* File Preview Modal */}
      <Dialog open={previewIndex !== null} onOpenChange={() => setPreviewIndex(null)}>
        <DialogContent>
          {previewIndex !== null && (
            <div className="relative flex flex-col items-center w-full h-[80vh] bg-white">
              {/* File Preview in center */}
              <div className="flex-1 flex items-center justify-center w-full p-4">
                {renderFilePreview(files[previewIndex])}
              </div>

              {/* Navigation Arrows */}
              {previewIndex > 0 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {previewIndex < files.length - 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* File Info */}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {files[previewIndex].name}
              </div>

              {/* Bottom Action Bar */}
              <div className="absolute bottom-0 left-0 w-full bg-gray-100 text-black flex justify-center gap-8 py-3">
                <button
                  onClick={() => handleDownload(files[previewIndex])}
                  className="flex flex-col items-center hover:text-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs mt-1">Download</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex flex-col items-center hover:text-blue-600 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  <span className="text-xs mt-1">Print</span>
                </button>
                <button
                  onClick={() => handleDelete(files[previewIndex].id)}
                  className="flex flex-col items-center hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-xs mt-1">Delete</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};