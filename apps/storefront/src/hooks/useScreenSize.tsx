import { useState, useEffect } from 'react';

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<
    'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | ''
  >('');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize('xs');
      } else if (
        window.innerWidth >= 640 &&
        window.innerWidth < 768
      ) {
        setScreenSize('sm');
      } else if (
        window.innerWidth >= 768 &&
        window.innerWidth < 1024
      ) {
        setScreenSize('md');
      } else if (
        window.innerWidth >= 1024 &&
        window.innerWidth < 1280
      ) {
        setScreenSize('lg');
      } else if (
        window.innerWidth >= 1280 &&
        window.innerWidth < 1536
      ) {
        setScreenSize('xl');
      } else if (window.innerWidth >= 1536) {
        setScreenSize('2xl');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () =>
      window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};
