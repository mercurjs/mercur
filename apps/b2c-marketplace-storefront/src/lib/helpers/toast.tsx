import { toast as sonnerToast } from 'sonner';

import { DoneIcon, ErrorIcon, CloseIcon } from '@/icons';

export const toast = {
  info: ({ description, title }: { description?: string; title: string }) => {
    sonnerToast.info(title, {
      className: 'bg-blue-100 text-blue-900',
      description
    });
  },
  success: ({ description, title }: { description?: string; title: string }) => {
    sonnerToast.success(title, {
      description,
      duration: 10000,
      icon: <DoneIcon color="rgb(20, 83, 45)" />,
      cancel: {
        label: <CloseIcon size={22} color='rgba(9, 9, 9, 1)' className='cursor-pointer ml-auto' />,
        onClick: () => {}
      },
      cancelButtonStyle: {
        backgroundColor: 'transparent',
        border: 'none'
      },
      classNames: {
        icon: 'self-start pt-2',
        toast: 'items-start gap-3',
        title: 'text-md text-primary'
      }
    });
  },
  error: ({ description, title }: { description?: string; title: string }) => {
    sonnerToast.error(title, {
      description,
      icon: <ErrorIcon color="rgb(155, 34, 25)" />,
      cancel: {
        label: <CloseIcon size={22} color='rgba(9, 9, 9, 1)' className='cursor-pointer ml-auto' />,
        onClick: () => {}
      },
      cancelButtonStyle: {
        backgroundColor: 'transparent',
        border: 'none'
      },
      classNames: {
        icon: 'self-start pt-2',
        toast: 'items-start gap-3',
        title: 'text-md text-primary',
      }
    });
  }
};
