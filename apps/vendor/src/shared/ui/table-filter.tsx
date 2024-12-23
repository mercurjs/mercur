import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectGroup,
  SelectContent
} from './select'

import { CirclePlus, CircleX } from 'lucide-react'
import { Typography } from './text'
import { cn } from '../lib'
import { Button } from './button'

type TableFilterOption = {
  label: string
  value: string
}

type TableFilterProps = {
  options: TableFilterOption[]
  label: string
  value: string | null
  onChange: (value: string | null) => void
}

export const TableFilter = ({
  options,
  label,
  value,
  onChange
}: TableFilterProps) => {
  return (
    <div className="relative">
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger
          withArrow={!!value}
          className={cn(
            'flex rounded-full h-7 px-2 py-1 w-fit gap-x-2 items-center justify-between border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
            {
              'border border-dashed bg-background': !value,
              'border bg-card': !!value
            }
          )}
        >
          {value ? (
            <span className="size-4"></span>
          ) : (
            <CirclePlus className="size-4 text-muted-foreground" />
          )}
          <div className="flex items-center">
            <Typography size="small" className="text-muted-foreground">
              {label}
            </Typography>
            {value && <span className="border-r mx-2 h-3" />}
            {value && (
              <span className="text-brand">
                <SelectValue />
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {value && (
        <Button
          className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-muted-foreground"
          size="icon"
          variant="transparent"
          onClick={() => onChange(null)}
        >
          <CircleX className=" size-4" />
        </Button>
      )}
    </div>
  )
}
