import React, { createContext, useContext, useEffect, useRef, useState } from "react"

import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addSeconds,
  addYears,
  format,
  getHours,
  isAfter,
  isBefore,
  isValid,
  setHours,
} from "date-fns"

interface DateFieldContextValue {
  value: Date | null
  setValue: (date: Date | null) => void
  disabled: boolean
  readonly: boolean
  isInvalid: boolean
  segments: Segment[]
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  locale: string
  granularity: Granularity
  hourCycle: 12 | 24
  isDateUnavailable?: (date: Date) => boolean
  setFocusedElement: (el: HTMLElement) => void
}

interface Segment {
  part: SegmentPart
  value: string
}

type SegmentPart = "day" | "month" | "year" | "hour" | "minute" | "second" | "dayPeriod" | "literal"

type Granularity = "day" | "hour" | "minute" | "second"

interface DateFieldRootProps {
  children:
    | React.ReactNode
    | ((props: {
        modelValue: Date | null
        segments: Segment[]
        isInvalid: boolean
        isDateUnavailable?: (date: Date) => boolean
        setFocusedElement: (el: HTMLElement) => void
      }) => React.ReactNode)
  as?: React.ElementType
  defaultValue?: Date | null
  value?: Date | null
  onValueChange?: (date: Date | null) => void
  placeholder?: Date
  defaultPlaceholder?: Date
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  isDateUnavailable?: (date: Date) => boolean
  minValue?: Date
  maxValue?: Date
  granularity?: Granularity
  locale?: string
  hourCycle?: 12 | 24
  hideTimeZone?: boolean
  dir?: "ltr" | "rtl"
  id?: string
  name?: string
  className?: string
  [key: string]: unknown
}

interface DateFieldInputProps {
  part: SegmentPart
  as?: React.ElementType
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}

// Context for DateField
const DateFieldContext = createContext<DateFieldContextValue | null>(null)

const useDateFieldContext = () => {
  const context = useContext(DateFieldContext)
  if (!context) {
    throw new Error("DateField components must be used within DateFieldRoot")
  }
  return context
}

// Helper to get segment value from date
const getSegmentValue = (date: Date, part: SegmentPart) => {
  if (!date || !isValid(date)) return ""

  const formatMap: Record<string, string> = {
    day: "dd",
    month: "MM",
    year: "yyyy",
    hour: "hh",
    minute: "mm",
    second: "ss",
    dayPeriod: "a",
  }

  try {
    return format(date, formatMap[part] || "")
  } catch {
    return ""
  }
}

// Generate segments based on granularity
const generateSegments = (
  date: Date | null,
  granularity: Granularity = "day",
  hourCycle: 12 | 24 = 12
): Segment[] => {
  const segments: Segment[] = []

  // Date segments
  segments.push({ part: "month", value: date ? getSegmentValue(date, "month") : "" })
  segments.push({ part: "literal", value: "/" })
  segments.push({ part: "day", value: date ? getSegmentValue(date, "day") : "" })
  segments.push({ part: "literal", value: "/" })
  segments.push({ part: "year", value: date ? getSegmentValue(date, "year") : "" })

  // Time segments based on granularity
  if (["hour", "minute", "second"].includes(granularity)) {
    segments.push({ part: "literal", value: ", " })
    segments.push({ part: "hour", value: date ? getSegmentValue(date, "hour") : "" })

    if (["minute", "second"].includes(granularity)) {
      segments.push({ part: "literal", value: ":" })
      segments.push({ part: "minute", value: date ? getSegmentValue(date, "minute") : "" })
    }

    if (granularity === "second") {
      segments.push({ part: "literal", value: ":" })
      segments.push({ part: "second", value: date ? getSegmentValue(date, "second") : "" })
    }

    if (hourCycle === 12) {
      segments.push({ part: "literal", value: " " })
      segments.push({ part: "dayPeriod", value: date ? getSegmentValue(date, "dayPeriod") : "" })
    }
  }

  return segments
}

// DateFieldRoot Component
export const DateFieldRoot = ({
  children,
  as: Component = "div",
  defaultValue,
  value: controlledValue,
  onValueChange,
  placeholder,
  defaultPlaceholder,
  disabled = false,
  readonly = false,
  required: _required = false,
  isDateUnavailable,
  minValue,
  maxValue,
  granularity = "day",
  locale = "en-US",
  hourCycle = 12,
  hideTimeZone: _hideTimeZone = false,
  dir = "ltr",
  id,
  name,
  className,
  ...props
}: DateFieldRootProps) => {
  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue ?? null)
  const [_internalPlaceholder, _setInternalPlaceholder] = useState<Date>(
    defaultPlaceholder ?? placeholder ?? new Date()
  )
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLElement>(null)

  const isControlled = controlledValue !== undefined
  const dateValue = isControlled ? controlledValue : internalValue

  const handleValueChange = (newValue: Date | null) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  const segments = generateSegments(dateValue, granularity, hourCycle)

  const isInvalid =
    dateValue &&
    isValid(dateValue) &&
    ((minValue && isBefore(dateValue, minValue)) ??
      (maxValue && isAfter(dateValue, maxValue)) ??
      isDateUnavailable?.(dateValue))

  const setFocusedElement = (el: HTMLElement) => {
    if (el) el.focus()
  }

  const contextValue: DateFieldContextValue = {
    value: dateValue,
    setValue: handleValueChange,
    disabled,
    readonly,
    isInvalid: !!isInvalid,
    segments,
    focusedIndex,
    setFocusedIndex,
    locale,
    granularity,
    hourCycle,
    isDateUnavailable,
    setFocusedElement,
  }

  return (
    <DateFieldContext.Provider value={contextValue}>
      <Component
        ref={containerRef}
        id={id}
        className={className}
        data-disabled={disabled ? "" : undefined}
        data-readonly={readonly ? "" : undefined}
        data-invalid={isInvalid ? "" : undefined}
        dir={dir}
        {...props}
      >
        {typeof children === "function"
          ? children({
              modelValue: dateValue,
              segments,
              isInvalid: !!isInvalid,
              isDateUnavailable,
              setFocusedElement,
            })
          : children}
        {name && dateValue && isValid(dateValue) && (
          <input type="hidden" name={name} value={format(dateValue, "yyyy-MM-dd")} />
        )}
      </Component>
    </DateFieldContext.Provider>
  )
}

// DateFieldInput Component
export const DateFieldInput = ({
  part,
  as: Component = "div",
  children,
  className,
  ...props
}: DateFieldInputProps) => {
  const {
    value,
    setValue,
    disabled,
    readonly,
    isInvalid,
    segments,
    focusedIndex,
    setFocusedIndex,
    hourCycle,
  } = useDateFieldContext()

  const segment = segments.find(s => s.part === part)
  const segmentIndex = segments.indexOf(segment!)
  const inputRef = useRef<HTMLElement>(null)
  const [tempInput, setTempInput] = useState("")

  const isFocused = focusedIndex === segmentIndex
  const isPlaceholder = !segment?.value

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

  const getOrCreateDate = () => {
    return value && isValid(value) ? value : new Date()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || readonly) return

    if (part === "literal") return

    // Arrow navigation
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      let prevIndex = segmentIndex - 1
      while (prevIndex >= 0 && segments[prevIndex].part === "literal") {
        prevIndex--
      }
      if (prevIndex >= 0) {
        setFocusedIndex(prevIndex)
      }
    } else if (e.key === "ArrowRight" || e.key === "Tab") {
      if (e.key === "Tab") {
        return // Let default tab behavior work
      }
      e.preventDefault()
      let nextIndex = segmentIndex + 1
      while (nextIndex < segments.length && segments[nextIndex].part === "literal") {
        nextIndex++
      }
      if (nextIndex < segments.length) {
        setFocusedIndex(nextIndex)
      }
    }
    // Increment/decrement
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      const delta = e.key === "ArrowUp" ? 1 : -1
      handleIncrement(delta)
      setTempInput("")
    }
    // Number input
    else if (/^\d$/.test(e.key)) {
      e.preventDefault()
      handleNumberInput(e.key)
    }
    // AM/PM
    else if (
      (e.key === "a" || e.key === "A" || e.key === "p" || e.key === "P") &&
      part === "dayPeriod"
    ) {
      e.preventDefault()
      handlePeriodChange(e.key.toLowerCase())
    }
    // Backspace
    else if (e.key === "Backspace") {
      e.preventDefault()
      handleBackspace()
    }
  }

  const handleIncrement = (delta: number) => {
    const currentDate = getOrCreateDate()
    let newDate = currentDate

    switch (part) {
      case "day":
        newDate = addDays(currentDate, delta)
        break
      case "month":
        newDate = addMonths(currentDate, delta)
        break
      case "year":
        newDate = addYears(currentDate, delta)
        break
      case "hour":
        newDate = addHours(currentDate, delta)
        break
      case "minute":
        newDate = addMinutes(currentDate, delta)
        break
      case "second":
        newDate = addSeconds(currentDate, delta)
        break
    }

    setValue(newDate)
  }

  const handleNumberInput = (digit: string) => {
    const currentDate = getOrCreateDate()
    const newInput = tempInput + digit
    const num = parseInt(newInput, 10)

    let shouldMoveNext = false
    let newDate = currentDate

    switch (part) {
      case "month":
        if (num >= 1 && num <= 12) {
          newDate = new Date(
            currentDate.getFullYear(),
            num - 1,
            currentDate.getDate(),
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds()
          )
          if (newInput.length === 2 || num > 1) {
            shouldMoveNext = true
          }
        }
        break
      case "day":
        if (num >= 1 && num <= 31) {
          newDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            num,
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds()
          )
          if (newInput.length === 2 || num > 3) {
            shouldMoveNext = true
          }
        }
        break
      case "year":
        if (newInput.length <= 4) {
          if (newInput.length === 4) {
            newDate = new Date(
              num,
              currentDate.getMonth(),
              currentDate.getDate(),
              currentDate.getHours(),
              currentDate.getMinutes(),
              currentDate.getSeconds()
            )
            shouldMoveNext = true
          }
        }
        break
      case "hour": {
        const maxHour = hourCycle === 12 ? 12 : 23
        if (num >= 0 && num <= maxHour) {
          newDate = setHours(currentDate, num)
          if (newInput.length === 2 || num > (hourCycle === 12 ? 1 : 2)) {
            shouldMoveNext = true
          }
        }
        break
      }
      case "minute":
      case "second":
        if (num >= 0 && num <= 59) {
          if (part === "minute") {
            newDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              currentDate.getHours(),
              num,
              currentDate.getSeconds()
            )
          } else {
            newDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              currentDate.getHours(),
              currentDate.getMinutes(),
              num
            )
          }
          if (newInput.length === 2 || num > 5) {
            shouldMoveNext = true
          }
        }
        break
    }

    if (isValid(newDate)) {
      setValue(newDate)
      setTempInput(shouldMoveNext ? "" : newInput)

      if (shouldMoveNext) {
        let nextIndex = segmentIndex + 1
        while (nextIndex < segments.length && segments[nextIndex].part === "literal") {
          nextIndex++
        }
        if (nextIndex < segments.length) {
          setFocusedIndex(nextIndex)
        }
      }
    }
  }

  const handlePeriodChange = (letter: string) => {
    const currentDate = getOrCreateDate()
    if (part !== "dayPeriod") return

    const isPM = letter === "p"
    const currentHour = getHours(currentDate)
    const newHour = isPM
      ? currentHour < 12
        ? currentHour + 12
        : currentHour
      : currentHour >= 12
        ? currentHour - 12
        : currentHour

    setValue(setHours(currentDate, newHour))
  }

  const handleBackspace = () => {
    if (tempInput) {
      setTempInput(tempInput.slice(0, -1))
    } else {
      const currentDate = getOrCreateDate()
      let newDate = currentDate

      switch (part) {
        case "day":
          newDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds()
          )
          break
        case "month":
          newDate = new Date(
            currentDate.getFullYear(),
            0,
            currentDate.getDate(),
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds()
          )
          break
        case "year":
          newDate = new Date(
            new Date().getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds()
          )
          break
      }

      if (isValid(newDate)) {
        setValue(newDate)
      }
    }
  }

  const handleFocus = () => {
    setFocusedIndex(segmentIndex)
    setTempInput("")
  }

  const displayValue = tempInput ?? segment?.value ?? (isPlaceholder ? part : "")

  if (part === "literal") {
    return <span className={className}>{segment?.value ?? children}</span>
  }

  return (
    <Component
      ref={inputRef}
      role="spinbutton"
      aria-label={part}
      aria-valuenow={segment?.value}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={className}
      data-disabled={disabled ? "" : undefined}
      data-invalid={isInvalid ? "" : undefined}
      data-placeholder={isPlaceholder ? "" : undefined}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...props}
    >
      {children ?? displayValue}
    </Component>
  )
}

// Demo Component
function DateFieldDemo() {
  const [date, setDate] = useState<Date | null>(null)
  const [dateWithTime, setDateWithTime] = useState<Date | null>(null)

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">DateField React Component</h1>
        <p className="text-gray-600 mb-2">
          Conversion de reka-ui DateField (Vue) vers React avec date-fns
        </p>
        <p className="text-sm text-blue-600">
          ✨ Utilise date-fns au lieu de @internationalized/date
        </p>
      </div>

      <div className="space-y-6">
        {/* Date simple */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Date (jour uniquement)</label>

          <DateFieldRoot
            value={date}
            onValueChange={setDate}
            granularity="day"
            className="flex items-center bg-white border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
          >
            {({ segments }) => (
              <>
                {segments.map((item, index) => (
                  <DateFieldInput
                    key={`${item.part}-${index}`}
                    part={item.part}
                    className={
                      item.part === "literal"
                        ? "text-gray-500 px-0.5"
                        : "px-1 rounded focus:outline-none focus:bg-blue-100 data-[placeholder]:text-gray-400 min-w-[2ch] text-center hover:bg-gray-50"
                    }
                  />
                ))}
              </>
            )}
          </DateFieldRoot>

          {date && isValid(date) && (
            <div className="text-sm text-gray-600">Date sélectionnée: {format(date, "PPPP")}</div>
          )}
        </div>

        {/* Date avec heure */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date et heure (avec minutes)
          </label>

          <DateFieldRoot
            value={dateWithTime}
            onValueChange={setDateWithTime}
            granularity="minute"
            hourCycle={12}
            className="flex items-center bg-white border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500"
          >
            {({ segments }) => (
              <>
                {segments.map((item, index) => (
                  <DateFieldInput
                    key={`${item.part}-${index}`}
                    part={item.part}
                    className={
                      item.part === "literal"
                        ? "text-gray-500 px-0.5"
                        : "px-1 rounded focus:outline-none focus:bg-purple-100 data-[placeholder]:text-gray-400 min-w-[2ch] text-center hover:bg-gray-50"
                    }
                  />
                ))}
              </>
            )}
          </DateFieldRoot>

          {dateWithTime && isValid(dateWithTime) && (
            <div className="text-sm text-gray-600">
              Date et heure: {format(dateWithTime, "PPpp")}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <h3 className="font-semibold text-gray-900">✅ Fonctionnalités</h3>
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
          <li>Navigation au clavier (Flèches gauche/droite)</li>
          <li>Incrément/décrément avec flèches haut/bas</li>
          <li>Saisie directe de nombres</li>
          <li>Support AM/PM (touches A/P)</li>
          <li>Mode contrôlé et non-contrôlé</li>
          <li>Granularité configurable (jour, heure, minute, seconde)</li>
          <li>Accessible (ARIA attributes)</li>
        </ul>

        <h3 className="font-semibold text-gray-900 pt-2">📦 Utilise date-fns</h3>
        <p className="text-sm text-gray-700">
          Aucune dépendance à @internationalized/date - utilise vos fonctions date-fns existantes
        </p>
      </div>
    </div>
  )
}

export default DateFieldDemo
