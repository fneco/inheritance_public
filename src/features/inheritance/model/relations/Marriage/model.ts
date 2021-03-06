import { function as F, readonlyRecord as RR } from 'fp-ts'
import * as R from 'ramda'
import { memoizeCurriedFn } from 'src/utils/fp/common'
import { Marriage, RID, UndirectedRelID } from '../../relation'
import { RStore } from '../shared'

// -------------------------------------------------------------------------------------------------
// instance / type
// -------------------------------------------------------------------------------------------------
const rstore = RStore.fixType<UndirectedRelID, Marriage>(RID.createUndirected)

// -------------------------------------------------------------------------------------------------
// insert / create
// -------------------------------------------------------------------------------------------------
export const { upsertAt, insertAt } = rstore

// -------------------------------------------------------------------------------------------------
// Create
// Read
// -------------------------------------------------------------------------------------------------
export const filterByID = memoizeCurriedFn(rstore.filterByID)

export const { getWithIndex: safeGetWithIndex, get: safeGet } = rstore

// -------------------------------------------------------------------------------------------------
// Update
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Delete
// -------------------------------------------------------------------------------------------------
export const { reject, remove } = rstore

// -------------------------------------------------------------------------------------------------
// pred
// -------------------------------------------------------------------------------------------------
export const greaterThanEqualTwo = F.flow(RR.size, R.lte(2))
export const lessThanTwo = F.flow(RR.size, R.gt(2))
