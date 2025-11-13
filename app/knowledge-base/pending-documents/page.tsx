// app/knowledge-base/pending-documents/page.tsx
"use client";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/store/hooks";
import Header from "@/components/common/Header";
import Title from "@/components/common/Title";
import Subtitle from "@/components/common/SubTitle";
import Bar from "@/components/common/PaginationBar";
import { FiPlus } from "react-icons/fi";
import { FaSlidersH } from "react-icons/fa";
import { useState } from "react";
import { Download, FileText, Check, X, Eye, Clock } from 'lucide-react';

export default function PendingDocumentsPage() {
  const { isDark, colors } = useTheme();
  const [openFilter, setOpenFilter] = useState(false);

  const PendingDocumentsTitleBtn = [
    {
      name: "Upload for Review",
      icon: <FiPlus />,
      onClick: () => console.log("upload for review clicked")
    }
  ]

  const subTitleBtn = [
    {
      name: "search",
      icon: " "
    },
    {
      icon: <FaSlidersH />,
      onClick: () => setOpenFilter(true),
      name: "Add Filters"
    },
  ]

  interface Document {
    id: string;
    filename: string;
    size: string;
    type: string;
    submittedBy: string;
    submittedDate: string;
    department: string;
    priority: 'high' | 'medium' | 'low';
  }

  const pendingDocumentsData: Document[] = [
    {
      id: '1',
      filename: 'Budget-Proposal-2024.xlsx',
      size: '3.1 MB',
      type: 'Excel',
      submittedBy: 'John Doe',
      submittedDate: '2024-01-15',
      department: 'Finance',
      priority: 'high'
    },
    {
      id: '2',
      filename: 'Client-Meeting-Notes.docx',
      size: '1.2 MB',
      type: 'Word',
      submittedBy: 'Jane Smith',
      submittedDate: '2024-01-14',
      department: 'Sales',
      priority: 'medium'
    },
    {
      id: '3',
      filename: 'Technical-Specifications.pdf',
      size: '5.7 MB',
      type: 'PDF',
      submittedBy: 'Mike Johnson',
      submittedDate: '2024-01-13',
      department: 'Engineering',
      priority: 'low'
    },
    {
      id: '4',
      filename: 'Marketing-Plan-Q1.pptx',
      size: '8.3 MB',
      type: 'PowerPoint',
      submittedBy: 'Sarah Wilson',
      submittedDate: '2024-01-12',
      department: 'Marketing',
      priority: 'high'
    },
    {
      id: '5',
      filename: 'Project-Timeline.pdf',
      size: '2.4 MB',
      type: 'PDF',
      submittedBy: 'Robert Brown',
      submittedDate: '2024-01-11',
      department: 'Project Management',
      priority: 'medium'
    }
  ];

  const getFileIcon = (type: string) => {
    const iconClass = "w-6 h-6";
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'excel':
        return <FileText className={`${iconClass} text-green-600`} />;
      case 'word':
        return <FileText className={`${iconClass} text-blue-600`} />;
      case 'powerpoint':
        return <FileText className={`${iconClass} text-orange-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-400`} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
    
    switch (priority) {
      case 'high':
        return `${baseClasses} text-red-800 bg-red-100 border border-red-200`;
      case 'medium':
        return `${baseClasses} text-yellow-800 bg-yellow-100 border border-yellow-200`;
      case 'low':
        return `${baseClasses} text-green-800 bg-green-100 border border-green-200`;
      default:
        return `${baseClasses} text-gray-800 bg-gray-100 border border-gray-200`;
    }
  };

  const handleApprove = (document: Document) => {
    console.log(`Approving: ${document.filename}`);
    // Add your approval logic here
  };

  const handleReject = (document: Document) => {
    console.log(`Rejecting: ${document.filename}`);
    // Add your rejection logic here
  };

  const handleDownload = (document: Document) => {
    console.log(`Downloading: ${document.filename}`);
    // Add your download logic here
  };

  const handleView = (document: Document) => {
    console.log(`Viewing: ${document.filename}`);
    // Add your view logic here
  };

  return (
    <ProtectedRoute>
      <div className="w-screen h-screen overflow-hidden flex" style={{
        backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
      }}>
        <Sidebar />
        <div className="flex-1 flex flex-col relative min-w-0 w-full">
          <Header />
          <div className='border-t-2 border-b-2 border-l-2 border-gray-200 flex-1 m-1 overflow-hidden flex flex-col relative rounded-lg' style={{
            borderColor: isDark ? colors.dark.border : colors.light.border,
            backgroundColor: isDark ? colors.dark.contentBg : colors.light.contentBg
          }}>
            <div className='border-b-gray-400 border-b-[0.5px] px-5 py-3 h-fit' style={{ 
              borderBottomColor: isDark ? colors.dark.border : colors.light.border 
            }}>
              <BreadcrumbsNavBar />
            </div>
            
            {/* Title Section */}
            <div
              className='mx-5 mt-5 px-6 py-4 rounded-lg shadow-sm h-fit'
              style={{
                backgroundColor: isDark ? colors.dark.sidebar : colors.light.sidebar,
                border: `1px solid ${isDark ? colors.dark.border : colors.light.border}`
              }}
            >
              <Title TitleObj={PendingDocumentsTitleBtn} name="Pending Documents" />
            </div>

            {/* Subtitle Section with Search and Filters */}
            <div className='mx-5 mt-4 py-3 px-4 rounded-lg h-fit' style={{
              backgroundColor: isDark ? colors.dark.sidebar : '#f8f9fa',
              border: `1px solid ${isDark ? colors.dark.border : colors.light.border}`
            }}>
              <Subtitle
                subtitleObj={subTitleBtn}
                action={openFilter}
                onClose={() => setOpenFilter(false)}
              />
            </div>

            {/* Pagination Section */}
            <div className='mx-5 mt-4 py-2 px-3 rounded-lg h-fit'>
              <Bar 
                total={pendingDocumentsData.length} 
                currentPage={1} 
                pageSize={10} 
                onPageChange={(page: number) => console.log('Page changed:', page)}
                onPageSizeChange={(size: number) => console.log('Page size changed:', size)} 
              />
            </div>

            {/* Pending Documents Table */}
            <div className="flex-1 mx-5 mb-5 mt-2 px-2 py-2 rounded overflow-auto">
              <div className="rounded-lg border overflow-hidden" style={{
                backgroundColor: isDark ? colors.dark.card : '#ffffff',
                borderColor: isDark ? colors.dark.border : '#e5e7eb',
              }}>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b font-semibold text-sm" style={{
                  backgroundColor: isDark ? colors.dark.sidebar : '#f9fafb',
                  borderColor: isDark ? colors.dark.border : '#e5e7eb',
                  color: isDark ? colors.dark.text : '#374151'
                }}>
                  <div className="col-span-3">Document Name</div>
                  <div className="col-span-2">Submitted By</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-2">Submitted Date</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Body */}
                <div className={`divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}`}>
                  {pendingDocumentsData.map((document) => (
                    <div 
                      key={document.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-opacity-50 transition-colors"
                      style={{
                        backgroundColor: isDark ? colors.dark.card : '#ffffff',
                      }}
                    >
                      {/* Document Name */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6'
                          }}
                        >
                          {getFileIcon(document.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{
                            color: isDark ? colors.dark.text : '#1f2937'
                          }}>
                            {document.filename}
                          </p>
                          <p className="text-xs" style={{
                            color: isDark ? colors.dark.textLight : '#6b7280'
                          }}>
                            {document.size} • {document.type}
                          </p>
                        </div>
                      </div>

                      {/* Submitted By */}
                      <div className="col-span-2">
                        <span className="text-sm" style={{
                          color: isDark ? colors.dark.text : '#374151'
                        }}>
                          {document.submittedBy}
                        </span>
                      </div>

                      {/* Department */}
                      <div className="col-span-2">
                        <span className="text-sm" style={{
                          color: isDark ? colors.dark.text : '#374151'
                        }}>
                          {document.department}
                        </span>
                      </div>

                      {/* Priority */}
                      <div className="col-span-1">
                        <span className={getPriorityBadge(document.priority)}>
                          {document.priority.charAt(0).toUpperCase() + document.priority.slice(1)}
                        </span>
                      </div>

                      {/* Submitted Date */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" style={{
                            color: isDark ? colors.dark.textLight : '#6b7280'
                          }} />
                          <span className="text-sm" style={{
                            color: isDark ? colors.dark.text : '#374151'
                          }}>
                            {document.submittedDate}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center gap-2">
                        <button 
                          onClick={() => handleView(document)}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          style={{
                            color: isDark ? colors.dark.text : '#374151',
                          }}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDownload(document)}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          style={{
                            color: isDark ? colors.dark.text : '#374151',
                          }}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleApprove(document)}
                          className="p-2 rounded hover:bg-green-100 transition-colors"
                          style={{
                            color: isDark ? '#86efac' : '#16a34a',
                          }}
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReject(document)}
                          className="p-2 rounded hover:bg-red-100 transition-colors"
                          style={{
                            color: isDark ? '#fca5a5' : '#dc2626',
                          }}
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}