'use client';
import { Card } from '@/components/atoms';
import { MinusThinIcon } from '@/icons';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export const ProductPageAccordion = ({
  children,
  heading,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  heading: string;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(
    defaultOpen ? '100%' : 0
  );

  const accordionRef = useRef(null);

  useEffect(() => {
    if (accordionRef.current)
      setContentHeight(
        accordionRef.current['scrollHeight'] || 0
      );
  }, []);

  const openHandler = () => {
    setOpen(!open);
  };
  return (
    <Card>
      <div
        onClick={openHandler}
        className='flex justify-between items-center cursor-pointer px-2 py-4'
      >
        <h4 className='label-lg uppercase'>{heading}</h4>
        <div className='relative'>
          <MinusThinIcon
            className={cn(
              'absolute top-0 left-0 transition-all duration-300',
              !open && 'rotate-90'
            )}
          />
          <MinusThinIcon />
        </div>
      </div>
      <div
        ref={accordionRef}
        className={cn(
          'transition-all duration-300 h-full overflow-hidden px-2'
        )}
        style={{ maxHeight: open ? contentHeight : 0 }}
      >
        <div className='py-2'>{children}</div>
      </div>
    </Card>
  );
};
