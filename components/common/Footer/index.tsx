import React from 'react';
import { useTheme } from '../../../store/hooks';

const Footer = () => {
  const { isDark, colors } = useTheme();

  return (
    <footer 
      className='py-2 border-t flex flex-row justify-between items-center w-full px-2 h-fit'
      style={{
        backgroundColor: isDark ? colors.dark.lightBg : colors.light.background,
        borderTopColor: isDark ? colors.dark.lightText + '40' : colors.light.text + '40'
      }}
    >
      <div className='flex justify-center items-center h-full'>
        <p 
          className='text-[10px] sm:text-[12px] lg:text-[14px] text-center'
          style={{ color: isDark ? colors.dark.lightText : colors.light.lightText }}
        >
          © 2025 Ameya Innovex. All rights reserved.
        </p>
      </div>
      <div className='flex justify-center items-center h-full md:w-auto'>
        <p 
          className='text-[10px] sm:text-[12px] lg:text-[14px] flex flex-row gap-x-2 text-center'
          style={{ color: isDark ? colors.dark.lightText : colors.light.lightText }}
        >
          <span>Designed by</span>
          <a 
            href="http://iameya.in/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className='hover:underline'
            style={{ color: isDark ? colors.dark.company : colors.light.company }}
          >
            Ameya Innovex
          </a>
          <span className='hidden md:inline'>|</span>
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer" 
            className='hover:underline'
            style={{ color: isDark ? colors.dark.company : colors.light.company }}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
