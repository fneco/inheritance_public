/* eslint-disable @typescript-eslint/ban-types */
import { array as A, either as E, function as F, nonEmptyArray as NEA, option as O } from 'fp-ts'
import * as R from 'ramda'
import * as yup from 'yup'
import { ValidateOptions } from 'yup/lib/types'
import { toArray } from 'src/utils/common'
import { addStr, _remove_me_v3 } from 'src/utils/fp/common'
import { MessageEmitterWithOptions, validationApplicative } from './validation'

// https://github.com/jquense/yup#mixedwhenkeys-string--arraystring-builder-object--value-schema-schema-schema
export const contextPrefix = '$' as const //  https://github.com/jquense/yup/blob/70d0b67e172f695168c5d00bc9856f2f775e0957/src/Reference.ts#L5
export const contextKey = 'ctx' as const
export const contextPath = `${contextPrefix}${contextKey}` as const
/**
 * @example
 ```ts
import * as yup from 'yup'
import { contextPath, createContextForReference } from 'src/utils/fp/common/yup'

const objSchema = yup.object({
  startDate: yup.mixed().when([contextPath, 'endDate'], ((
    context: any,
    endDate: any,
    schema: any
  ) => {
    if (context == null) throw new Error('you must provide context.')

    console.log('context:', context) // context: { a: 'start', b: 'end' }
    console.log('endDate:', endDate) // endDate: 11
    return schema
  }) as any),
  endDate: yup.string(),
})
const context = { a: 'start', b: 'end' }
const data = { startDate: '10', endDate: '11' }
console.log(objSchema.validateSync(data, { context: createContextForReference(context) }))
```
 */
export const createContextForReference = <A>(context: A): { ctx: A } => ({ [contextKey]: context })

type TestMethod = yup.BaseSchema['test']
export type TestMethodParams = Parameters<TestMethod>
export type TestFunction = TestMethodParams[2]

export const addTest =
  (schema: yup.BaseSchema) =>
  (
    predObj: Record<string, (x: any) => boolean>,
    message: string,
    option?: { skipWhen: (x: any) => boolean }
  ): yup.BaseSchema => {
    const [[name, pred], ..._] = Object.entries(predObj)
    return schema.test(name, message, (value, _context) => {
      if (option?.skipWhen(value)) return true
      return pred(value)
    })
  }
export const makeTest = addTest(yup.mixed())

// https://github.com/jquense/yup#mixedvalidatevalue-any-options-object-promiseany-validationerror
// eslint-disable-next-line @typescript-eslint/ban-types
export const toSyncValidator =
  <TContext = {}>(option?: ValidateOptions<TContext>) =>
  <Schema extends yup.BaseSchema = yup.BaseSchema>(schema: Schema) =>
  <X>(x: X): E.Either<NEA.NonEmptyArray<string>, X> =>
    F.pipe(
      E.tryCatch(() => schema.validateSync(x, option), _remove_me_v3),
      E.mapLeft(error2stringNEA)
    )

const error2stringNEA = (err: unknown): NEA.NonEmptyArray<string> => {
  if (err instanceof yup.ValidationError) {
    return F.pipe(
      NEA.fromArray(err.errors),
      O.getOrElse(F.constant(['Yup.ValidationError has empty errors'] as NEA.NonEmptyArray<string>))
    )
  }
  if (err instanceof Error) {
    return [err.message]
  }
  return ['unknown']
}
const toStrictSyncValidator = toSyncValidator({ strict: true })

type IsValidSync = yup.BaseSchema['isValidSync']
export const toSimplePredicate =
  <Schema extends yup.BaseSchema>(schema: Schema) =>
  <X>(x: X): ReturnType<IsValidSync> =>
    schema.isValidSync(x, {
      strict: true, // ????????????????????????????????????
      abortEarly: true,
    })

export const combineToSimplePredicate = <Schema extends yup.BaseSchema>(
  schemas: Schema | Schema[]
): (<X>(x: X) => ReturnType<IsValidSync>) =>
  F.pipe(toArray(schemas), A.map(toSimplePredicate), R.allPass)

// validateSync ???????????????, validate ???????????????, ????????????????????????????????????????????????????????????????????????.
// ?????????, yup.string() ???????????? test ??????????????????, FieldValidator ??? errors.length ??? 1 .???????????????????????????????????????.
// abortEarly: false ?????????????????????????????????????????????.
// ????????????, ??????????????????????????????????????????????????????, schema ??????????????????????????????.
export const toMessageEmitter =
  <Schema extends yup.BaseSchema = yup.BaseSchema>(
    schemas: Schema | Schema[]
  ): MessageEmitterWithOptions =>
  (x) =>
    F.pipe(
      toArray(schemas),
      A.map(toStrictSyncValidator),
      A.map(R.applyTo(x)),
      A.sequence(validationApplicative),
      E.foldW(F.flow(R.join('????????????'), addStr('???')), F.constVoid)
    )

// https://github.com/jquense/yup/issues/232
