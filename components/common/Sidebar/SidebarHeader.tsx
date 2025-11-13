"use client";
import React, { useState } from 'react';
import { RiMenuUnfoldLine, RiMenuFoldLine } from 'react-icons/ri';
import { useTheme } from '../../../store/hooks';
import { Button, Popover } from '@mui/material';
import { useDispatch_, useSelector_ } from '@/store';
import { FaBuilding } from 'react-icons/fa';
import { setSuiteApp } from '@/store/api';

interface Props {
  isCollapsed: boolean;
  onToggle?: () => void;
}

interface CustomSelectProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  onChange: (option: { value: string; label: string }) => void;
  placeholder?: string;
  renderOption?: (option: { value: string; label: string }) => React.ReactNode;
  className?: string;
}

const SidebarHeader: React.FC<Props> = ({ isCollapsed, onToggle }) => {
  const { isDark, colors } = useTheme();
  const suiteOptions = [
    { value: 'lazykill', label: 'PM' },
    { value: 'biz-accelator', label: 'SM' },
    { value: 'biz-desk', label: 'CRM' },
    { value: 'biz-iginite', label: 'HRM' },
  ];


  const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    renderOption = (option) => option.label,
    className = "",
  }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedOption, setSelectedOption] = useState(
      options.find((opt) => opt.value === value) || null
    );

    const open = Boolean(anchorEl);
    const id = open ? 'custom-select-popover' : undefined;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const handleSelect = (option: { value: string; label: string }) => {
      setSelectedOption(option);
      onChange(option);
      handleClose();
    };

    return (
      <div className={`${className}`}>
        <Button
          aria-describedby={id}
          onClick={handleClick}
          variant="outlined"
          sx={{
            textTransform: 'none',
            justifyContent: 'space-between',
            minHeight: 30,
            width: '150px',
            fontSize: { xs: '10px', sm: '10px', lg: '10px' },
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            backgroundColor: isDark ? colors.dark.lightBg : colors.light.background,
            borderColor: (isDark ? colors.dark.lightText : colors.light.text) + '40',
            color: isDark ? colors.dark.text : colors.light.text,
            '&:hover': {
              backgroundColor: isDark ? colors.dark.lightBg : colors.light.background,
              opacity: 0.9
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, fontSize: "10px", width: '100px' }} className="w-fit truncate text-xs">
            {selectedOption ? renderOption(selectedOption) : placeholder}
          </div>
          <span
            style={{
              marginLeft: 8,
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            ▼
          </span>
        </Button>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                width: 200,
                maxHeight: 240,
                overflowY: 'auto',
                backgroundColor: isDark ? colors.dark.lightBg : colors.light.background,
                border: '1px solid ' + (isDark ? colors.dark.lightText + '40' : colors.light.text + '40'),
                boxShadow: 3,
                p: 0,
              }
            }
          }}
        >
          {options.map((option: { value: string; label: string }, index: number) => {
            const active = selectedOption?.value === option.value;
            return (
              <div
                key={index}
                onClick={() => handleSelect(option)}
                style={{
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: active ? (isDark ? colors.dark.company : colors.light.company) : 'transparent',
                  color: active ? '#fff' : (isDark ? colors.dark.text : colors.light.text),
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = (isDark ? colors.dark.company : colors.light.company) + '20';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {renderOption(option)}
              </div>
            );
          })}
        </Popover>
      </div>
    );
  };
  const selectedSuiteApp = useSelector_((state) => state.globalState.suiteApp);
  const dispatch = useDispatch_();

  return (
    <div className="flex items-center justify-between px-4 h-15 py-2 relative border-b border-white/20">
      <div className={`flex items-center transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'min-w-fit opacity-100'}`}>
        {!isCollapsed && (
          <CustomSelect
            options={suiteOptions}
            value={selectedSuiteApp}
            onChange={(option: { value: string; label: string }) => dispatch(setSuiteApp(option.value))}
            className="w-fit"
            renderOption={(option: { value: string; label: string }) => (
              <div className="flex items-center">
                <span className="mr-2"><FaBuilding size={16} /></span>
                <span className="truncate text-[10px] sm:text-[12px] lg:text-[14px]">{option.label}</span>
              </div>
            )}
          />
        )}
      </div>
      {onToggle && (
        <button
          onClick={onToggle}
          className={`text-white w-fit! cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-all duration-200 ease-in-out ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine size={22} />
          ) : (
            <RiMenuFoldLine size={22} />
          )}
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
