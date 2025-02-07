import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from 'models/Status'

type WithdrawUSDCState = {
  withdrawStatus: Status
  destinationAddress?: string
  amount?: number
  withdrawError?: Error
  destinationError?: Error
  amountError?: Error
}

const initialState: WithdrawUSDCState = {
  withdrawStatus: Status.IDLE
}

const slice = createSlice({
  name: 'withdraw-usdc',
  initialState,
  reducers: {
    beginWithdrawUSDC: (
      state,
      _action: PayloadAction<{
        amount: number
        destinationAddress: string
        onSuccess: (transaction: string) => void
      }>
    ) => {
      state.withdrawStatus = Status.LOADING
    },
    withdrawUSDCSucceeded: (state) => {
      state.withdrawError = undefined
      state.withdrawStatus = Status.SUCCESS
    },
    withdrawUSDCFailed: (state, action: PayloadAction<{ error: Error }>) => {
      state.withdrawStatus = Status.ERROR
      state.withdrawError = action.payload.error
    },
    cleanup: () => initialState
  }
})

export const {
  beginWithdrawUSDC,
  withdrawUSDCSucceeded,
  withdrawUSDCFailed,
  cleanup
} = slice.actions

export default slice.reducer
export const actions = slice.actions
