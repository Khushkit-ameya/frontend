import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** placeholder so the interface is not empty */
  _?: never;
}

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
  <button
    {...props}
    className="flex text-sm justify-between items-center cursor-pointer w-full border rounded p-2 mt-2 bg-white dark:bg-gray-800 dark:border-gray-600 capitalize text-left"
  >
    {children}
  </button>
);