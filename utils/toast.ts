import { toast, ToastOptions, ToastContent, Id } from 'react-toastify';

// Default toast options
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Custom toast configurations
export const customToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...defaultOptions,
      autoClose: 7000, // Show errors a bit longer
      ...options,
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      ...defaultOptions,
      autoClose: 6000,
      ...options,
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      ...defaultOptions,
      ...options,
    });
  },
  
  // Custom loading toast
  loading: (message: string) => {
    return toast.loading(message, {
      position: "top-right",
    });
  },
  
  // Update a loading toast with success
  updateSuccess: (toastId: Id, message: ToastContent) => {
    toast.update(toastId, {
      render: message,
      type: "success",
      isLoading: false,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },
  
  // Update a loading toast with error
  updateError: (toastId: Id, message: ToastContent) => {
    toast.update(toastId, {
      render: message,
      type: "error",
      isLoading: false,
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },
  
  // Dismiss specific toast
  dismiss: (toastId?: Id) => {
    toast.dismiss(toastId);
  },
  
  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  }
};

export default customToast;