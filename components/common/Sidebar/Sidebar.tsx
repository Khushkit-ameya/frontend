"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import Menu, { SubMenuItem } from './Menu';
import { BiSolidDashboard, BiPurchaseTag, BiSolidPurchaseTagAlt } from 'react-icons/bi';
import { PiBuildingsFill, PiGitPullRequest, PiPersonSimpleRunBold } from 'react-icons/pi';
import { MdWarehouse } from 'react-icons/md';
import { IoSettings } from 'react-icons/io5';
import { HiMiniSquaresPlus, HiUserGroup, HiUser } from 'react-icons/hi2';
import { SiLoop } from 'react-icons/si';
import { useTheme } from '../../../store/hooks';
import { FaNetworkWired, FaProjectDiagram } from 'react-icons/fa';
import { useSelector_ } from '@/store';
import { GiConsoleController } from 'react-icons/gi';
import Image from 'next/image';
import sideBarLogo from "@/assests/sidebarBelowLogo.png";
import LOGO from '@/assests/Logo.svg';
import { FiFileText, FiUsers } from 'react-icons/fi';

// SVG Icon components for Bizaccelerator
const DashboardIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/dashboard-.svg" alt="Dashboard" className={className} width={16} height={16} />
);
const ContactsIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/contacts.svg" alt="Contacts" className={className} width={16} height={16} />
);
const LeadsIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/leads.svg" alt="Leads" className={className} width={16} height={16} />
);
const OpportunitiesIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/opportunities.svg" alt="Opportunities" className={className} width={16} height={16} />
);
const DealsIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/deal.svg" alt="Deals" className={className} width={16} height={16} />
);
const ActivitiesIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/activity.svg" alt="Activities" className={className} width={16} height={16} />
);
const AccountsIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/accounts.svg" alt="Accounts" className={className} width={16} height={16} />
);
const PaymentsIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/BizAccleratorSidebarIcons/productsservice.svg" alt="Payments" className={className} width={16} height={16} />
);

interface SidebarProps {
  type?: 'main' | 'master';
}

// Simple permission stub (adjust later to real data)
const usePermission = () => {
  return (perm: string) => true; // allow all for now
};

const Sidebar: React.FC<SidebarProps> = ({ type = 'main' }) => {
  const suiteApp = useSelector_((state) => state.globalState.suiteApp);
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const pathname = usePathname();
  const can = usePermission();
  const { isDark, colors, companyThemeColor } = useTheme();

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);

    // Simulate loading completion
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Adjust timing as needed

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (mobile) setCollapsed(false); // always expanded logic on mobile (panel slides)
  }, [mobile]);

  const projectSubMenu: SubMenuItem[] = [];
  const leadSubMenu: SubMenuItem[] = [];
  const KnowledgeSubMenu: SubMenuItem[] = [
    { id: 'kb1', name: 'My Documents', icon: FiFileText, link: '/knowledge-base/my-documents' },
    { id: 'kb2', name: 'Pending Documents', icon: FiFileText, link: '/knowledge-base/pending-documents' },
    { id: 'kb3', name: 'Knowledge Base', icon: FiFileText, link: '/knowledge-base' },
  ];
  const LeaveSubMenu: SubMenuItem[] = [
    { id: 'r1', name: 'Leave Type', icon: FiFileText, link: '/biz-ignite/LeaveMaintainence/LeaveType' },
    { id: 'r2', name: 'Leave Records', icon: FiFileText, link: '/biz-ignite/LeaveMaintainence/userLeaveBalance' },
    { id: 'r3', name: 'Leave Request', icon: FiFileText, link: '/biz-ignite/LeaveMaintainence/LeaveRequest' },
    { id: 'r4', name: 'Leave Balance', icon: FiFileText, link: '/biz-ignite/LeaveMaintainence/LeaveBalance' },
    { id: 'r5', name: 'Leave Applied', icon: FiFileText, link: '/biz-ignite/LeaveMaintainence/leaveApplied' },

  ];
  const AttendanceSubMenu: SubMenuItem[] = [
    { id: 'a1', name: 'All Attendance', icon: FiFileText, link: '/biz-ignite/attendance/admin' },
    { id: 'a2', name: 'My Attendance', icon: FiFileText, link: '/biz-ignite/attendance/user' },

  ];

  const sidebarBg = companyThemeColor
    ? companyThemeColor
    : (isDark ? colors.dark.sidebar : colors.light.sidebar);

  const buttonBg = companyThemeColor
    ? companyThemeColor
    : (isDark ? colors.dark.lightBg : colors.light.company);

  console.log("sideBAr color=", sidebarBg);

  // Return loader while loading
  // if (loading) {
  //   return (
  //     <div className="h-screen flex items-center justify-center" style={{ backgroundColor: sidebarBg }}>
  //       <div className="w-full h-full min-h-[300px] flex items-center justify-center">
  //         <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {mobile && (
        <button
          onClick={() => setOpen(o => !o)}
          className="fixed top-2 left-2 z-5 p-2 rounded-lg bg-white shadow hover:bg-gray-50"
          style={{ color: buttonBg }}
          aria-expanded={open}
        >
          <span className="text-xs font-semibold">{open ? 'Close' : 'Menu'}</span>
        </button>
      )}
      {open && mobile && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-40" />
      )}
      <div
        className={`h-screen flex flex-col z-5 ${collapsed ? 'w-16' : 'min-w-[15%]'} transition-all duration-300 ${mobile ? `fixed top-0 left-0 ${open ? 'translate-x-0' : '-translate-x-full'} shadow-xl` : 'relative'}`}
        style={{ backgroundColor: sidebarBg }}
      >
        <SidebarHeader isCollapsed={collapsed} onToggle={() => mobile ? setOpen(o => !o) : setCollapsed(c => !c)} />
        <div className="flex-1 overflow-y-auto py-2 space-y-1 relative flex flex-col items-center">
          <div id='sidebar>dashboard' className="w-full space-y-1 ">
            <Menu id='sidebar>dashboard' name='Dashboard' MainIcon={DashboardIcon} submenu={[]} link='/dashboard' isCollapsed={collapsed} pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)} />
            {/* <Menu id='sidebar>projects' name='projects' MainIcon={BiSolidDashboard} submenu={[]} link='/projects' isCollapsed={collapsed} pathName={pathname || ''} onItemClick={() => mobile && setOpen(false)} /> */}

          </div>

          {(can('sidebar>project') && suiteApp == "lazykill") && (
            projectSubMenu.length > 0 ? (
              <>
                <Menu
                  id="sidebar>project"
                  name="Projects"
                  MainIcon={FaProjectDiagram}
                  link="/lazykill/projects"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                <Menu
                  id="sidebar>activities"
                  name="Activities"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/activities"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                {/* <Menu
                  id="sidebar>kanban"
                  name="Kanban"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/kanban"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                /> */}
                <Menu
                  id="sidebar>repeat"
                  name="Repeat Task List"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/repetitive-tasks"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                <Menu
                  id="sidebar>company-job-bucket"
                  name="Company Job Bucket"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/company-job-bucket"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                </>
              ) : (
                <>
                <Menu
                  id="sidebar>project"
                  name="Projects"
                  MainIcon={FaProjectDiagram}
                  link="/lazykill/projects"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                <Menu
                  id="sidebar>activities"
                  name="Activities"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/activities"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                {/* <Menu
                  id="sidebar>kanban"
                  name="Kanban"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/kanban"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                /> */}
                <Menu
                  id="sidebar>repeat"
                  name="Repeat Task List"
                  MainIcon={FaNetworkWired}
                  link="/lazykill/repetitive-tasks"
                  isCollapsed={collapsed}
                  pathName={pathname || ''}
                  onItemClick={() => mobile && setOpen(false)}
                />
                </>
            )
          )}

          {(can('sidebar>KnowledgeBase') && (suiteApp === "lazykill" || suiteApp === "biz-iginite" || suiteApp === "biz-accelator")) && (
            KnowledgeSubMenu.length > 0 ? (
              <Menu
                id="sidebar>KnowledgeBase"
                name="Knowledge Base"
                MainIcon={HiUserGroup}
                submenu={KnowledgeSubMenu}
                link="/knowledge-base" // Add this line
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            ) : (
              <Menu
                id="sidebar>KnowledgeBase"
                name="Knowledge Base"
                MainIcon={HiUserGroup}
                link="/knowledge-base"
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            )
          )}
          {(can('sidebar>Shift') && suiteApp == "biz-iginite") && (
            <Menu
              id="sidebar>Shift"
              name="Shift"
              MainIcon={HiUserGroup}
              link="/biz-ignite/shift"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}
          {(can('sidebar>Attendance') && suiteApp == "biz-iginite") && (
            LeaveSubMenu.length > 0 ? (
              <Menu
                id="sidebar>Attendance"
                name="Attendance"
                MainIcon={FaProjectDiagram}
                submenu={AttendanceSubMenu}
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            ) : (
              <Menu
                id="sidebar>Attendance"
                name="Attendance"
                MainIcon={FaProjectDiagram}
                link="/biz-ignite/Attendance"
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            )
          )}

          {(can('sidebar>Holiday') && suiteApp == "biz-iginite") && (
            <Menu
              id="sidebar>Holiday"
              name="Holiday"
              MainIcon={HiUserGroup}
              link="/biz-ignite/Holiday"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>LeaveRequest') && suiteApp == "biz-iginite") && (
            LeaveSubMenu.length > 0 ? (
              <Menu
                id="sidebar>LeaveRequest"
                name="Leaves"
                MainIcon={FaProjectDiagram}
                submenu={LeaveSubMenu}
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            ) : (
              <Menu
                id="sidebar>LeaveRequest"
                name="All Leave Requests"
                MainIcon={FaProjectDiagram}
                link="/biz-ignite/LeaveMaintainence"
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            )
          )}

          {(can('sidebar>contacts') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>contacts"
              name="Contacts"
              MainIcon={ContactsIcon}
              link="/bizaccelerator/contacts"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>lead') && suiteApp == "biz-accelator") &&
            (leadSubMenu.length > 0 ? (
              <Menu
                id="sidebar>lead"
                name="Lead"
                MainIcon={LeadsIcon}
                submenu={leadSubMenu}
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            ) : (
              <Menu
                id="sidebar>lead"
                name="Leads"
                MainIcon={LeadsIcon}
                link="/bizaccelerator/leads"
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />
            ))}

          {(can('sidebar>opportunities') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>opportunities"
              name="Opportunities"
              MainIcon={OpportunitiesIcon}
              link="/bizaccelerator/opportunities"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}
          {(can('sidebar>deals') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>deals"
              name="Deals"
              MainIcon={DealsIcon}
              link="/bizaccelerator/deals"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}
          {(can('sidebar>activities') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>activities"
              name="Activities"
              MainIcon={ActivitiesIcon}
              link="/bizaccelerator/activities"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>accounts') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>accounts"
              name="Accounts"
              MainIcon={AccountsIcon}
              link="/bizaccelerator/accounts"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>customers') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>customers"
              name="Customers"
              MainIcon={ContactsIcon}
              link="/bizaccelerator/customers"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>quotations') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>quotations"
              name="Quotations"
              MainIcon={DealsIcon}
              link="/bizaccelerator/quotations"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>payments') && suiteApp == "biz-accelator") && (
            <Menu
              id="sidebar>payments"
              name="Payments"
              MainIcon={PaymentsIcon}
              link="/bizaccelerator/payments"
              isCollapsed={collapsed}
              pathName={pathname || ''}
              onItemClick={() => mobile && setOpen(false)}
            />
          )}

          {(can('sidebar>ignite') && suiteApp == "biz-ignite") && (
            <>
              {/* Shift Menu */}
              <Menu
                id="sidebar>ignite>shift"
                name="Shift"
                MainIcon={HiUserGroup}
                link="/bizIgnite/shift"
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
              />

              {/* Attendance Menu with Admin and User Submenus */}
              <Menu
                id="sidebar>ignite>attendance"
                name="Attendance"
                MainIcon={HiMiniSquaresPlus}
                isCollapsed={collapsed}
                pathName={pathname || ''}
                onItemClick={() => mobile && setOpen(false)}
                submenu={[
                  {
                    id: 'sidebar>ignite>attendance>admin',
                    name: 'Admin',
                    link: '/bizIgnite/attendance/admin',
                    icon: HiUser,
                  },
                  {
                    id: 'sidebar>ignite>attendance>user',
                    name: 'User',
                    link: '/bizIgnite/attendance/user',
                    icon: HiUserGroup,
                  },
                ]}
              />
            </>
          )}

          <div className=" flex items-center justify-center py-4 absolute bottom-0">
            <Image src={sideBarLogo} alt="Logo" className="w-full object-contain" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Image src={LOGO} alt="LOGO" className="w-1/2 object-contain" />
            </div>
          </div>
        </div>
        <SidebarFooter isCollapsed={collapsed} />
      </div >
    </>
  );
};

export default Sidebar;
