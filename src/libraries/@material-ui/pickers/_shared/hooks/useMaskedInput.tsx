import * as React from 'react'
import { useUtils } from './useUtils'
import { createDelegatedEventHandler } from '../../_helpers/utils'
import { DateInputProps, MuiTextFieldProps } from '../PureDateInput'
import {
  // maskedDateFormatter,
  getDisplayDate,
  // checkMaskIsValidForCurrentFormat,
} from '../../_helpers/text-field-helper'
import { useRifm } from 'src/utils/react/hooks'

type MaskedInputProps = Omit<
  DateInputProps,
  | 'open'
  | 'adornmentPosition'
  | 'renderInput'
  | 'openPicker'
  | 'InputProps'
  | 'InputAdornmentProps'
  | 'openPickerIcon'
  | 'disableOpenPicker'
  | 'getOpenDialogAriaText'
  | 'OpenPickerButtonProps'
> & { inputProps?: Partial<React.HTMLProps<HTMLInputElement>> }

export function useMaskedInput({
  // acceptRegex = /[\d]/gi,
  disabled,
  // disableMaskedInput,
  ignoreInvalidInputs,
  inputFormat,
  inputProps,
  label,
  // mask,
  onChange,
  rawValue, // 大元の props.value
  readOnly,
  rifmFormatter,
  TextFieldProps,
  validationError,
}: MaskedInputProps): MuiTextFieldProps {
  const utils = useUtils()
  const isFocusedRef = React.useRef(false)

  const getInputValue = React.useCallback(
    () => getDisplayDate(utils, rawValue, inputFormat),
    [inputFormat, rawValue, utils]
  )

  // const formatHelperText = utils.getFormatHelperText(inputFormat)
  // const [innerInputValue, setInnerInputValue] = React.useState<string>(getInputValue())

  // const shouldUseMaskedInput = React.useMemo(() => {
  //   // formatting of dates is a quite slow thing, so do not make useless .format calls
  //   if (!mask || disableMaskedInput) {
  //     return false
  //   }

  //   return checkMaskIsValidForCurrentFormat(mask, inputFormat, acceptRegex, utils)
  // }, [acceptRegex, disableMaskedInput, inputFormat, mask, utils])

  // const formatter = React.useMemo(
  //   () =>
  //     shouldUseMaskedInput && mask ? maskedDateFormatter(mask, acceptRegex) : (st: string) => st,
  //   [acceptRegex, mask, shouldUseMaskedInput]
  // )

  // React.useEffect(() => {
  //   // We do not need to update the input value on keystroke
  //   // Because library formatters can change inputs from 12/12/2 to 12/12/0002
  //   if ((rawValue === null || utils.isValid(rawValue)) && !isFocusedRef.current) {
  //     setInnerInputValue(getInputValue())
  //   }
  // }, [utils, getInputValue, rawValue])

  const handleChange = (textFromRifm: string) => {
    // const finalString = text === '' || text === mask ? '' : text
    // setInnerInputValue(finalString)
    const finalString = textFromRifm

    let date =
      finalString === null || finalString === '' ? null : utils.parse(finalString, inputFormat)

    if (date !== null && !utils.isValid(date)) {
      date = undefined
      if (ignoreInvalidInputs) {
        return
      }
    }

    onChange(date, finalString || undefined)
  }

  const rifmProps = useRifm({
    // value: innerInputValue,
    value: getInputValue(),
    passValue: true,
    onChange: handleChange,
    format: rifmFormatter, //|| formatter,
  })

  const inputStateArgs = rifmProps
  // shouldUseMaskedInput
  //   ? rifmProps
  //   : {
  //       value: innerInputValue,
  //       onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
  //         handleChange(event.currentTarget.value)
  //       },
  //     }

  return {
    label,
    disabled,
    error: validationError,
    // helperText: formatHelperText,
    inputProps: {
      ...inputStateArgs,
      disabled, // make spreading in custom input easier
      // placeholder: formatHelperText,
      readOnly,
      type: 'tel',
      // type: shouldUseMaskedInput ? 'tel' : 'text',
      ...inputProps,
      onFocus: createDelegatedEventHandler(() => {
        isFocusedRef.current = true
      }, inputProps?.onFocus),
      onBlur: createDelegatedEventHandler(() => {
        isFocusedRef.current = false
      }, inputProps?.onBlur),
    },
    ...TextFieldProps,
  }
}
