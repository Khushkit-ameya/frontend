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
import { Download, FileText } from 'lucide-react';

export default function KnowledgePage() {
  const { isDark, colors } = useTheme();
  const [openFilter, setOpenFilter] = useState(false);

  const KnowledgeTitleBtn = [
    {
      name: "Upload Document",
      icon: <FiPlus />,
      onClick: () => console.log("upload btn clicked")
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
  }

  interface KnowledgeItem {
    id: string;
    title: string;
    uploadedBy: string;
    department: string;
    tags: string[];
    documents: Document[];
  }

  const knowledgeData: KnowledgeItem[] = [
    {
      id: '1',
      title: 'New Employee Onboarding Guide',
      uploadedBy: 'Sarah Lee',
      department: 'HR',
      tags: ['onboarding', 'policy', 'guide'],
      documents: [
        {
          id: 'doc1',
          filename: 'Employee-Onboarding-Guide-2024.pdf',
          size: '4.2 MB',
          type: 'PDF'
        },
        {
          id: 'doc2',
          filename: 'Onboarding-Checklist.xlsx',
          size: '1.8 MB',
          type: 'Excel'
        }
      ]
    },
    {
      id: '2',
      title: 'Software Development Standards',
      uploadedBy: 'Mike Chen',
      department: 'Engineering',
      tags: ['development', 'standards', 'coding'],
      documents: [
        {
          id: 'doc3',
          filename: 'Code-Standards-and-Best-Practices.pdf',
          size: '3.1 MB',
          type: 'PDF'
        },
        {
          id: 'doc4',
          filename: 'API-Documentation.docx',
          size: '2.4 MB',
          type: 'Word'
        },
        {
          id: 'doc5',
          filename: 'Database-Schema.sql',
          size: '1.2 MB',
          type: 'SQL'
        }
      ]
    },
    {
      id: '3',
      title: 'Sales Process Documentation',
      uploadedBy: 'Emily Rodriguez',
      department: 'Sales',
      tags: ['sales', 'process', 'training'],
      documents: [
        {
          id: 'doc6',
          filename: 'Sales-Process-Handbook.pdf',
          size: '5.7 MB',
          type: 'PDF'
        }
      ]
    },
    {
      id: '4',
      title: 'Financial Reporting Guidelines',
      uploadedBy: 'David Kim',
      department: 'Finance',
      tags: ['finance', 'reporting', 'compliance'],
      documents: [
        {
          id: 'doc7',
          filename: 'Monthly-Reporting-Template.xlsx',
          size: '2.9 MB',
          type: 'Excel'
        },
        {
          id: 'doc8',
          filename: 'Financial-Compliance-Guide.pdf',
          size: '4.5 MB',
          type: 'PDF'
        }
      ]
    },
    {
      id: '5',
      title: 'Marketing Campaign Templates',
      uploadedBy: 'Jessica Wang',
      department: 'Marketing',
      tags: ['marketing', 'templates', 'campaign'],
      documents: [
        {
          id: 'doc9',
          filename: 'Campaign-Planning-Template.pptx',
          size: '8.3 MB',
          type: 'PowerPoint'
        },
        {
          id: 'doc10',
          filename: 'Social-Media-Guidelines.pdf',
          size: '3.6 MB',
          type: 'PDF'
        },
        {
          id: 'doc11',
          filename: 'Brand-Assets.zip',
          size: '15.2 MB',
          type: 'Archive'
        }
      ]
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
      case 'sql':
        return <FileText className={`${iconClass} text-gray-600`} />;
      case 'archive':
        return <FileText className={`${iconClass} text-yellow-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-400`} />;
    }
  };

  const handleDownload = (document: Document) => {
    console.log(`Downloading: ${document.filename}`);
    // Add your download logic here
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
              <Title TitleObj={KnowledgeTitleBtn} name="Knowledge Base" />
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
                total={knowledgeData.length} 
                currentPage={1} 
                pageSize={10} 
                onPageChange={(page: number) => console.log('Page changed:', page)}
                onPageSizeChange={(size: number) => console.log('Page size changed:', size)} 
              />
            </div>

            {/* Knowledge Items List */}
            <div className="flex-1 mx-5 mb-5 mt-2 px-2 py-2 rounded overflow-auto">
              {knowledgeData.map((item) => (
                <div 
                  key={item.id} 
                  className="rounded-lg border mb-4 p-6 transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: isDark ? colors.dark.card : '#ffffff',
                    borderColor: isDark ? colors.dark.border : '#e5e7eb',
                  }}
                >
                  <div className="flex gap-6">
                    {/* Left Section - Content */}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2" style={{
                        color: isDark ? colors.dark.text : '#1f2937'
                      }}>
                        {item.title}
                      </h2>
                      <p className="text-sm mb-4" style={{
                        color: isDark ? colors.dark.textLight : '#6b7280'
                      }}>
                        Uploaded by: {item.uploadedBy}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 text-sm rounded-md border font-medium"
                          style={{
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe',
                            color: isDark ? '#93c5fd' : '#1e40af',
                            borderColor: isDark ? '#1e3a8a' : '#bfdbfe'
                          }}
                        >
                          Department: {item.department}
                        </span>
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-sm rounded-md border"
                            style={{
                              backgroundColor: isDark ? 'rgba(107, 114, 128, 0.1)' : '#f3f4f6',
                              color: isDark ? colors.dark.textLight : '#374151',
                              borderColor: isDark ? colors.dark.border : '#d1d5db'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Section - Documents */}
                    <div className="flex-1">
                      <div className="space-y-3">
                        {item.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                            style={{
                              backgroundColor: isDark ? colors.dark.sidebar : '#f9fafb',
                              borderColor: isDark ? colors.dark.border : '#e5e7eb'
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6'
                                }}
                              >
                                {getFileIcon(doc.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{
                                  color: isDark ? colors.dark.text : '#1f2937'
                                }}>
                                  {doc.filename}
                                </p>
                                <p className="text-xs truncate" style={{
                                  color: isDark ? colors.dark.textLight : '#6b7280'
                                }}>
                                  {doc.size} • {doc.type} Document
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDownload(doc)}
                              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                              style={{
                                color: isDark ? colors.dark.text : '#374151',
                                borderColor: isDark ? colors.dark.border : '#d1d5db',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}