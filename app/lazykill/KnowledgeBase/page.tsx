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
  }

  interface OnboardingGuide {
    id: string;
    title: string;
    uploadedBy: string;
    department: string;
    tags: string[];
    documents: Document[];
  }
  const dummyData: OnboardingGuide[] = [
    {
      id: '1',
      title: 'New Employee Onboarding Guide',
      uploadedBy: 'Sarah Lee',
      department: 'HR',
      tags: ['onboarding policy'],
      documents: [
        {
          id: 'doc1',
          filename: 'Leave Policy-q4.pdf',
          size: '4 MB'
        }
      ]
    },
    {
      id: '2',
      title: 'New Employee Onboarding Guide',
      uploadedBy: 'Sarah Lee',
      department: 'Finance',
      tags: ['Expense'],
      documents: [
        {
          id: 'doc2',
          filename: 'Expence-q4.pdf',
          size: '4 MB'
        },
        {
          id: 'doc3',
          filename: 'Expence-q4.pdf',
          size: '4 MB'
        }
      ]
    }
  ];
  return (
    <ProtectedRoute>
      <div className="w-screen h-screen overflow-hidden flex" style={{
        backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
      }}>
        <Sidebar />
        <div className="flex-1 flex flex-col relative min-w-0 w-full">
          <Header />
          <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
            <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
              <BreadcrumbsNavBar />
            </div>
            <div
              className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
              style={{
                backgroundColor: isDark ? colors.dark.sidebar : undefined
              }}
            >
              <Title TitleObj={KnowledgeTitleBtn} name="Knowledge Base" />
            </div>
            <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end h-fit' style={{
              backgroundColor: isDark ? colors.dark.sidebar : undefined
            }}>
              <Subtitle
                subtitleObj={subTitleBtn}
                action={openFilter}
                onClose={() => setOpenFilter(false)}
              />
            </div>
            <div className='mx-5 mt-9 py-2 px-2 rounded flex h-fit'>
              <Bar total={30} currentPage={0} pageSize={0} onPageChange={function (page: number): void {
                throw new Error("Function not implemented.");
              }} onPageSizeChange={function (size: number): void {
                throw new Error("Function not implemented.");
              }} />
            </div>

            <div className="flex-1 mx-5 mb-5 mt-2 px-2 py-2 rounded overflow-auto">
              {dummyData.map((e) => (
                <div key={e.id} className="bg-white rounded-md border border-gray-300 px-8 py-4 mb-4">
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {e.title}
                      </h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Uploaded by: {e.uploadedBy}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200 font-medium">
                          Department: {e.department}
                        </span>
                        {e.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-md border border-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 py-2 ">
                      {e.documents.map((doc) => (
                        <div
                          key={doc.id} // Add key prop here
                          className="flex mb-2 gap-20 items-center"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0">
                              <FileText className="w-58 h-8 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {doc.filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.size} PDF Document
                              </p>
                            </div>
                          </div>
                          <button className="flex items-center cursor-pointer gap-2 px-3 py-2 text-sm text-gray-700 border shadow-xl border-gray-300 rounded-md hover:bg-red-600 hover:text-white transition-colors active:scale-95">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>

                    <div></div>
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