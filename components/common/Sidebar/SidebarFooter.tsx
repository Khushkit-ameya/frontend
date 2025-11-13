"use client";
import React, { useState } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { RiArrowDropDownLine, RiArrowDropUpLine } from 'react-icons/ri';
import { TbLogout } from 'react-icons/tb';
import { useSelector_, useDispatch_ } from '../../../store';
import { clearUser } from '../../../store/api_query/global';
import { useRouter } from 'next/navigation';

interface User {
  id?: string;
  name?: string;
  role?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface Props {
  isCollapsed: boolean;
}

const SidebarFooter: React.FC<Props> = ({ isCollapsed }) => {
  const user = useSelector_((s) => s.globalState.user) as User | undefined;
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch_();
  const router = useRouter();

  const logout = () => {
    dispatch(clearUser());
    router.push('/login');
  };

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center px-2 h-16 relative">
        <div className="group relative">
          <div className="rounded-full bg-white/20 border-2 border-white p-2 flex items-center justify-center cursor-pointer hover:bg-white/30 shadow-md transition-colors duration-200">
            <FaRegUser size={18} className="text-white" />
          </div>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
            {user?.name} <span className="font-light">({user?.role || 'user'})</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 h-16 relative border-t border-white/20">
      <div className="flex items-center gap-x-3 flex-1">
        <div className="rounded-full bg-white/20 border-2 border-white p-2 flex items-center justify-center shadow-md">
          <FaRegUser className="text-white text-sm" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="text-white flex gap-x-1 items-center font-semibold hover:text-gray-200 text-sm truncate"
          >
            <span className="truncate max-w-[120px]">{user?.name || 'User'}</span>
            {open ? <RiArrowDropUpLine size={22} /> : <RiArrowDropDownLine size={22} />}
          </button>
          <div className="text-white/80 uppercase text-xs truncate">{user?.role || 'role'}</div>
        </div>
      </div>
      <button
        onClick={logout}
        className="border-l border-white/30 pl-3 h-full flex items-center justify-center hover:bg-white/10 transition-colors duration-200 rounded-r-lg"
        title="Logout"
      >
        <TbLogout className="text-white" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/20 rounded-t shadow-xl z-50">
          <div className="p-4 text-white space-y-2 text-sm">
            <div className="font-bold">Profile</div>
            <div>Name: <span className="font-semibold">{user?.name}</span></div>
            <div>Role: <span className="font-semibold">{user?.role}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;
