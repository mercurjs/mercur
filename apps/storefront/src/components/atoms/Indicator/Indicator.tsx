'use client';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface IndicatorProps {
  size?: 'small' | 'medium' | 'large';
  step: number;
  maxStep: number;
  className?: string;
  variant?: 'light' | 'dark';
  "data-testid"?: string;
}

export function Indicator({
  variant = 'light',
  size = 'medium',
  step,
  maxStep,
  className,
  "data-testid": dataTestId,
}: IndicatorProps) {
  const [wrapperWidth, setWrapperWidth] = useState(0);

  const wrapperRef = useRef<HTMLInputElement | null>(null);

  const baseClasses = {
    light: 'rounded-md bg-tertiary/10 relative',
    dark: 'rounded-md bg-primary/10 relative',
  };
  const sizeClasses = {
    small: 'w-full h-1',
    medium: 'w-full h-1',
    large: 'w-full h-1',
  };

  useEffect(() => {
    window.addEventListener('resize', () => {
      setWrapperWidth(
        wrapperRef.current
          ? wrapperRef.current.offsetWidth
          : 0
      );
    });

    return () =>
      window.removeEventListener('resize', () => null);
  }, []);

  useEffect(() => {
    setWrapperWidth(
      wrapperRef.current
        ? wrapperRef.current.offsetWidth
        : 0
    );
  }, [wrapperRef]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        baseClasses[variant],
        sizeClasses[size],
        className
      )}
      data-testid={dataTestId ?? 'indicator'}
    >
      <div
        className={cn(
          'h-full rounded-sm absolute transition-all duration-300',
          variant === 'light' ? 'bg-tertiary' : 'bg-white'
        )}
        style={{
          width: wrapperWidth / maxStep,
          left: (wrapperWidth / maxStep) * (step - 1),
        }}
      />
    </div>
  );
}
