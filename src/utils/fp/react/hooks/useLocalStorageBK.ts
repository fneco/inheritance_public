// https://github.com/streamich/react-use/blob/master/src/useLocalStorage.ts
import { useState, useCallback, Dispatch, SetStateAction } from 'react'
import { isBrowser } from 'src/utils/web'
import tb from 'ts-toolbelt'
import { function as F } from 'fp-ts'

type parserOptions<T> =
  | {
      raw: true
    }
  | {
      raw: false
      serializer: (value: T) => string
      deserializer: (value: string) => T
    }

const noop = F.constVoid

const useLocalStorage = <T>(
  key: string,
  initialValue?: T,
  options?: parserOptions<T>
): [T | undefined, Dispatch<SetStateAction<T | undefined>>, () => void] => {
  if (!isBrowser) {
    return [initialValue as T, noop, noop]
  }
  if (!key) {
    throw new Error('useLocalStorage key may not be falsy')
  }

  const deserializer = options
    ? options.raw
      ? (value: any) => value
      : options.deserializer
    : JSON.parse

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, setState] = useState<T | undefined>(() => {
    try {
      const serializer = options ? (options.raw ? String : options.serializer) : JSON.stringify

      const localStorageValue = localStorage.getItem(key)
      if (localStorageValue !== null) {
        return deserializer(localStorageValue)
      } else {
        initialValue && localStorage.setItem(key, serializer(initialValue))
        return initialValue
      }
    } catch {
      // If user is in private mode or has storage restriction
      // localStorage can throw. JSON.parse and JSON.stringify
      // can throw, too.
      return initialValue
    }
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const set: Dispatch<SetStateAction<T | undefined>> = useCallback(
    (valOrFunc) => {
      try {
        const newState =
          typeof valOrFunc === 'function' ? (valOrFunc as tb.F.Function)(state) : valOrFunc
        if (typeof newState === 'undefined') return
        let value: string

        if (options)
          if (options.raw)
            if (typeof newState === 'string') value = newState
            else value = JSON.stringify(newState)
          else if (options.serializer) value = options.serializer(newState)
          else value = JSON.stringify(newState)
        else value = JSON.stringify(newState)

        localStorage.setItem(key, value)
        setState(deserializer(value))
      } catch {
        // If user is in private mode or has storage restriction
        // localStorage can throw. Also JSON.stringify can throw.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, setState]
  )

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setState(undefined)
    } catch {
      // If user is in private mode or has storage restriction
      // localStorage can throw.
    }
  }, [key, setState])

  return [state, set, remove]
}

export default useLocalStorage
