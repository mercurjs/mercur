import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  Fragment,
} from "react"

import { HttpTypes } from "@medusajs/types"
import NativeSelect, {
  NativeSelectProps,
} from "@/components/molecules/NativeSelect/NativeSelect"
import clsx from "clsx"
import { Listbox, Transition } from "@headlessui/react"
import { clx } from "@medusajs/ui"
import { ChevronUpDown } from "@medusajs/icons"

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
  }
>(({ placeholder = "Country", region, defaultValue, ...props }, ref) => {
  const innerRef = useRef<HTMLSelectElement>(null)

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  const countryOptions = useMemo(() => {
    if (!region) {
      return []
    }

    return region.countries?.map((country) => ({
      value: country.iso_2,
      label: country.display_name,
    }))
  }, [region])

  const handleSelect = (value: string) => {
    props.onChange?.({
      target: {
        name: props.name,
        value,
      },
    } as React.ChangeEvent<HTMLSelectElement>)
  }

  return (
    <label className="label-md">
      <p className="mb-2">Country</p>
      <Listbox onChange={handleSelect} value={props.value}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              "relative w-full flex justify-between items-center px-4 h-12 bg-component-secondary text-left  cursor-default focus:outline-none border rounded-lg focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-gray-300 focus-visible:ring-offset-2 focus-visible:border-gray-300 text-base-regular"
            )}
            data-testid="shipping-address-select"
          >
            {({ open }) => (
              <>
                <span className="block truncate">
                  {countryOptions?.find(
                    (country) => country.value === props.value
                  )?.label || "Choose a country"}
                </span>
                <ChevronUpDown
                  className={clx("transition-rotate duration-200", {
                    "transform rotate-180": open,
                  })}
                />
              </>
            )}
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className="absolute z-20 w-full overflow-auto text-small-regular bg-white border rounded-lg border-top-0 max-h-60 focus:outline-none sm:text-sm"
              data-testid="shipping-address-options"
            >
              {countryOptions?.map(({ value, label }, index) => (
                <Listbox.Option
                  key={index}
                  value={value}
                  className="cursor-default select-none relative pl-6 pr-10 hover:bg-gray-50 py-4 border-b"
                  data-testid="shipping-address-option"
                >
                  {label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      <div className="hidden">
        <NativeSelect
          ref={innerRef}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={clsx(
            "hidden w-full h-12 items-center bg-component-secondary"
          )}
          {...props}
        >
          {countryOptions?.map(({ value, label }, index) => (
            <option key={index} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </label>
  )
})

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
