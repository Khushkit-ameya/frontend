import React, { useEffect, useRef, useState } from 'react';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import { usePathname } from 'next/navigation';
import { FaBuilding, FaTimes } from "react-icons/fa";
import { useTheme } from '../../../store/hooks';
import { useDispatch_, useSelector_ } from '../../../store';
import { setSuiteApp } from '../../../store/api_query/global';
import ProjectLogo from '@/assests/topHeaderLogo.png'
import Image from 'next/image';
const Header = () => {
  // Static suite options
  const { isDark, colors } = useTheme();
  const pathname = usePathname();

  // Selected suite app from global state
  const selectedSuiteApp = useSelector_((state) => state.globalState.suiteApp);
  console.log(selectedSuiteApp , "selectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteAppselectedSuiteApp")

  return (
    <>
      <div
        className='h-16 flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-end px-2 md:px-4 border-b-2 relative'
        style={{
          backgroundColor: "#ffffff",
          borderBottomColor: isDark ? colors.dark.company : colors.light.company
        }}
      >
        {selectedSuiteApp === 'lazykill' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {/* <Image src={ProjectLogo} alt="logo" /> */}
            <img src="/projecticon/Projectmanagement.svg" alt="Project Management" className="h-10 md:h-12" />
          </div>
        )}

        {selectedSuiteApp === 'biz-accelator' && pathname?.startsWith('/bizaccelerator') && (
          <div className="flex-1 flex justify-center">
            <img src="/LeadMananagementLogo.svg" alt="Leads Management" className="h-10 md:h-12" />
          </div>
        )}
        {selectedSuiteApp === 'biz-iginite' && (
          <div className="flex-1 flex justify-center">
            <img src="/assests/topHeaderLogo.png" alt="Project Management" className="h-10 md:h-12" />
          </div>
        )}

      </div> 
    </>
  );
};

export default Header;
