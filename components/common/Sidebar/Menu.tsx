"use client";
import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../../../store/hooks';

export interface SubMenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  link: string;
  id: string;
}

interface MenuProps {
  id: string;
  name: string;
  MainIcon: React.ComponentType<{ className?: string; size?: number }>;
  submenu?: SubMenuItem[];
  link?: string;
  isCollapsed: boolean;
  onItemClick?: () => void;
  pathName?: string;
}

const Menu: React.FC<MenuProps> = ({ id, name, MainIcon, submenu = [], link, isCollapsed, onItemClick, pathName }) => {
  const [open, setOpen] = useState(false);
  const { isDark, colors } = useTheme();

  const isActive = useCallback((href?: string) => {
    if (!href || !pathName) return false;
    return pathName === href; // exact match only
  }, [pathName]);


  // Check if any submenu item is active
  const hasActiveChild = useCallback(() => {
    if (!pathName || submenu.length === 0) return false;
    return submenu.some(item => isActive(item.link));
  }, [pathName, submenu, isActive]);

  const isParentActive = useCallback(() => {
    // Highlight only if the parent itself is active
    if (link && isActive(link)) return true;
    return false;
  }, [link, isActive]);


  useEffect(() => {
    // Auto-open the menu if any child is active
    if (hasActiveChild()) {
      setOpen(true);
    }
  }, [hasActiveChild]);

  const handleMainClick = () => {
    if (submenu.length > 0) {
      setOpen(o => !o);
    } else if (link) {
      onItemClick?.();
    }
  };

  const content = (
    <button
      onClick={handleMainClick}
      className={`group w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors ${isParentActive() ? 'bg-white/20' : ''
        }`}
    >
      <MainIcon className="text-white text-sm" />
      {!isCollapsed && <span className="text-white font-medium text-sm truncate">{name}</span>}
      {!isCollapsed && submenu.length > 0 && (
        <FiChevronRight className={`ml-auto text-white transition-transform ${open ? 'rotate-90' : ''}`} />
      )}
    </button>
  );

  return (
    <div id={id} className="w-full">
      {link && submenu.length === 0 ? (
        <Link href={link} onClick={onItemClick} className="block">
          {content}
        </Link>
      ) : (
        content
      )}

      {open && !isCollapsed && submenu.length > 0 && (
        <div className="pl-6 flex flex-col">
          {submenu.map(item => (
            <Link
              key={item.id}
              href={item.link}
              onClick={onItemClick}
              className={`flex items-center gap-2 py-1.5 pr-3 rounded-md hover:bg-white/10 transition-colors ${isActive(item.link) ? 'bg-white/20' : ''
                }`}
            >
              <item.icon className="text-white/80 ml-3 text-xs" />
              <span className="text-white/90 text-xs font-medium truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;