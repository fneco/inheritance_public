import * as React from 'react'
import { useOpenState } from './useOpenState'
import { WrapperVariant } from '../../wrappers/Wrapper'
import { BasePickerProps } from '@material-ui/pickers'
import { useUtils, useNow, MuiPickersAdapter } from './useUtils'

export interface PickerStateValueManager<TInput, TDateValue> {
  parseInput: (utils: MuiPickersAdapter, props: BasePickerProps<TInput, TDateValue>) => TDateValue
  emptyValue: TDateValue
  areValuesEqual: (
    utils: MuiPickersAdapter,
    valueLeft: TDateValue,
    valueRight: TDateValue
  ) => boolean
}

export type PickerSelectionState = 'partial' | 'shallow' | 'finish'

/**
 * コンポーネント全体で使用する State を取り扱う
 */
export function usePickerState<TInput, TDateValue>(
  props: BasePickerProps<TInput, TDateValue>,
  valueManager: PickerStateValueManager<TInput, TDateValue>
) {
  const { inputFormat, disabled, readOnly, onAccept, onChange, disableCloseOnSelect, value } = props

  if (!inputFormat) {
    throw new Error('inputFormat prop is required')
  }

  const now = useNow()
  const utils = useUtils()
  const { isOpen, setIsOpen } = useOpenState(props)

  // default だと, Date型 (= utils.date(props.value) の結果) が pickedrDate となる
  // つまり, DatePicker は 内部的には Date型が使われている
  const [pickerDate, setPickerDate] = React.useState(valueManager.parseInput(utils, props))

  // Mobile keyboard view is a special case.
  // When it's open picker should work like closed, cause we are just showing text field
  const [isMobileKeyboardViewOpen, setMobileKeyboardViewOpen] = React.useState(false)

  React.useEffect(() => {
    const parsedDateValue = valueManager.parseInput(utils, props)
    setPickerDate((currentPickerDate) => {
      if (!valueManager.areValuesEqual(utils, currentPickerDate, parsedDateValue)) {
        return parsedDateValue
      }

      return currentPickerDate
    })
    // We need to react only on value change, because `date` could potentially return new Date() on each render
  }, [value, utils]) // eslint-disable-line

  const acceptDate = React.useCallback(
    (acceptedDate: TDateValue, needClosePicker: boolean) => {
      console.condlog('date picker', 'acceptDate()')
      onChange(acceptedDate)

      if (needClosePicker) {
        setIsOpen(false)

        if (onAccept) {
          onAccept(acceptedDate)
        }
      }
    },
    [onAccept, onChange, setIsOpen]
  )

  const wrapperProps = React.useMemo(
    () => ({
      open: isOpen,
      onClear: () => acceptDate(valueManager.emptyValue, true),
      onAccept: () => acceptDate(pickerDate, true),
      onDismiss: () => {
        console.condlog('date picker', 'onDismiss()')
        setIsOpen(false)
      },
      onSetToday: () => {
        // TODO FIX ME
        setPickerDate(now as any)
        acceptDate(now as any, !disableCloseOnSelect)
      },
    }),
    [acceptDate, disableCloseOnSelect, isOpen, now, pickerDate, setIsOpen, valueManager.emptyValue]
  )

  const pickerProps = React.useMemo(
    () => ({
      // canAutoFocus,
      date: pickerDate,
      isMobileKeyboardViewOpen,
      toggleMobileKeyboardView: () => {
        if (!isMobileKeyboardViewOpen) {
          // accept any partial input done by React.user
          setPickerDate(pickerDate)
        }

        setMobileKeyboardViewOpen(!isMobileKeyboardViewOpen)
      },
      onDateChange: (
        newDate: TDateValue,
        wrapperVariant: WrapperVariant,
        selectionState: PickerSelectionState = 'partial'
      ) => {
        console.condlog('date picker', 'onDateChange', newDate, wrapperVariant, selectionState)
        setPickerDate(newDate)
        if (selectionState === 'partial') {
          acceptDate(newDate, false)
        }

        // finish は 日付選択時に渡される
        if (selectionState === 'finish') {
          const shouldCloseOnSelect = !(disableCloseOnSelect ?? wrapperVariant === 'mobile')
          acceptDate(newDate, shouldCloseOnSelect)
        }

        // if selectionState === "shallow" do nothing (we already update picker state)
      },
    }),
    [acceptDate, disableCloseOnSelect, isMobileKeyboardViewOpen, pickerDate]
  )

  const inputProps = React.useMemo(
    () => ({
      onChange,
      inputFormat,
      open: isOpen,
      rawValue: value,
      openPicker: () => {
        if (!readOnly && !disabled) {
          console.condlog('date picker', 'openPicker()')
          setIsOpen(true)
        }
      },
    }),
    [onChange, inputFormat, isOpen, value, readOnly, disabled, setIsOpen]
  )

  const pickerState = { pickerProps, inputProps, wrapperProps }
  React.useDebugValue(pickerState, () => ({
    MuiPickerState: {
      pickerDate,
      other: pickerState,
    },
  }))

  return pickerState
}
