'use client';
import { cn } from '@/lib/utils';
import { ChangeEvent } from 'react';

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: React.ReactNode;
  clearable?: boolean;
  error?: boolean;
  "data-testid"?: string;
}

export function Textarea({
  icon,
  clearable,
  className,
  error,
  "data-testid": dataTestId,
  ...props
}: TextAreaProps) {
  let paddingY = '';
  if (icon) paddingY += 'pl-[38px] ';
  if (clearable) paddingY += 'pr-[38px]';

  const changeHandler = (
    value: ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (props.onChange) props.onChange(value);
  };

  return (
    <div className='relative w-full'>
      {icon && (
        <span className='absolute top-[16px] left-[16px]' data-testid={dataTestId ? `${dataTestId}-icon` : 'textarea-icon'}>
          {icon}
        </span>
      )}
      <textarea
        className={cn(
          'w-full px-[16px] py-[12px] border rounded-sm bg-component-secondary focus:border-primary focus:outline-none focus:ring-0',
          error && 'border-negative focus:border-negative',
          props.disabled &&
            'bg-disabled cursor-not-allowed',
          paddingY,
          className
        )}
        value={props.value}
        onChange={(e) => changeHandler(e)}
        data-testid={dataTestId ?? 'textarea'}
        {...props}
      />
    </div>
  );
}
