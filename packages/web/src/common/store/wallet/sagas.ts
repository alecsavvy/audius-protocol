import {
  Name,
  Chain,
  BNWei,
  FeatureFlags,
  stringWeiToBN,
  weiToString,
  getErrorMessage,
  accountSelectors,
  accountActions,
  tokenDashboardPageActions,
  walletSelectors,
  InputSendDataAction,
  walletActions,
  getContext,
  ErrorLevel,
  createUserBankIfNeeded,
  solanaSelectors,
  SolanaWalletAddress,
  isNullOrUndefined
} from '@audius/common'
import type { AudiusLibs } from '@audius/sdk'
import BN from 'bn.js'
import { all, call, put, take, takeEvery, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { SETUP_BACKEND_SUCCEEDED } from 'common/store/backend/actions'
import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForWrite } from 'utils/sagaHelpers'

const { getFeePayer } = solanaSelectors

const ATA_SIZE = 165 // Size allocated for an associated token account

const {
  getBalance,
  setBalanceError,
  setBalance,
  send,
  sendSucceeded,
  sendFailed,
  decreaseBalance
} = walletActions
const { getAccountBalance, getFreezeUntilTime, getLocalBalanceDidChange } =
  walletSelectors
const {
  fetchAssociatedWallets,
  transferEthAudioToSolWAudio,
  setCanRecipientReceiveWAudio,
  inputSendData
} = tokenDashboardPageActions
const fetchAccountSucceeded = accountActions.fetchAccountSucceeded
const getAccountUser = accountSelectors.getAccountUser

// TODO: handle errors
const errors = {
  rateLimitError: 'Please wait before trying again'
}

function* getIsBalanceFrozen() {
  const freezeUntil = yield* select(getFreezeUntilTime)
  return freezeUntil && Date.now() < freezeUntil
}

/**
 * Transfers tokens to recipientWallet for amount tokens on eth or sol chain
 * @param action Object passed as redux action
 * @param action.payload The payload of the action
 * @param action.payload.recipientWallet The reciepint address either sol or eth
 * @param action.payload.amount The amount in string wei to transfer
 * @param action.playload.chain 'eth' or 'sol'
 */
function* sendAsync({
  payload: { recipientWallet, amount: weiAudioAmount, chain }
}: ReturnType<typeof send>) {
  // WalletClient relies on audiusBackendInstance. Use waitForWrite to ensure it's initialized
  yield* waitForWrite()
  const walletClient = yield* getContext('walletClient')
  const { track } = yield* getContext('analytics')

  const account = yield* select(getAccountUser)
  const weiBNAmount = stringWeiToBN(weiAudioAmount)
  const accountBalance = yield* select(getAccountBalance)
  const weiBNBalance = accountBalance ?? (new BN('0') as BNWei)

  const waudioWeiAmount: BNWei | null = yield* call([
    walletClient,
    'getCurrentWAudioBalance'
  ])

  if (isNullOrUndefined(waudioWeiAmount)) {
    yield* put(sendFailed({ error: 'Failed to fetch current wAudio balance.' }))
    return
  }

  if (
    chain === Chain.Eth &&
    (!weiBNBalance || !weiBNBalance.gte(weiBNAmount))
  ) {
    yield* put(sendFailed({ error: 'Not enough $AUDIO' }))
    return
  } else if (chain === Chain.Sol) {
    if (weiBNAmount.gt(weiBNBalance)) {
      yield* put(sendFailed({ error: 'Not enough $AUDIO' }))
      return
    }
  }

  try {
    yield* put(
      make(Name.SEND_AUDIO_REQUEST, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )

    // Ensure user has userbank

    const audiusBackend = yield* getContext('audiusBackendInstance')
    const feePayerOverride = yield* select(getFeePayer)
    if (!feePayerOverride) {
      console.error(`sendAsync: unexpectedly no fee payer`)
      return
    }
    yield* call(createUserBankIfNeeded, audiusBackend, {
      recordAnalytics: track,
      feePayerOverride
    })

    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (chain === Chain.Sol && weiBNAmount.gt(waudioWeiAmount)) {
      yield* put(transferEthAudioToSolWAudio())
      yield* call([walletClient, 'transferTokensFromEthToSol'])
    }

    if (chain === Chain.Eth) {
      yield* call([walletClient, 'sendTokens'], recipientWallet, weiBNAmount)
    } else {
      try {
        yield* call(
          [walletClient, 'sendWAudioTokens'],
          recipientWallet as SolanaWalletAddress,
          weiBNAmount
        )
      } catch (e) {
        const errorMessage = getErrorMessage(e)
        if (errorMessage === 'Missing social proof') {
          yield* put(sendFailed({ error: 'Missing social proof' }))
          return
        }
        if (
          errorMessage ===
          'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
        ) {
          yield* put(sendFailed({ error: errorMessage }))
          return
        }
        yield* put(
          sendFailed({ error: 'Something has gone wrong, please try again.' })
        )
        return
      }
    }

    // Only decrease store balance if we haven't already changed
    const newBalance: ReturnType<typeof getAccountBalance> = yield* select(
      getAccountBalance
    )
    if (newBalance?.eq(weiBNBalance)) {
      yield* put(decreaseBalance({ amount: weiAudioAmount }))
    }

    yield* put(sendSucceeded())
    yield* put(
      make(Name.SEND_AUDIO_SUCCESS, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    const isRateLimit = errorMessage === errors.rateLimitError
    let errorText = errorMessage
    if (isRateLimit) {
      errorText =
        'If you’ve already sent $AUDIO today, please wait a day before trying again'
    }
    yield* put(sendFailed({ error: errorText }))
    yield* put(
      make(Name.SEND_AUDIO_FAILURE, {
        from: account?.wallet,
        recipient: recipientWallet,
        error: errorText
      })
    )
  }
}

function* getWalletBalanceAndWallets() {
  yield* all([put(getBalance()), put(fetchAssociatedWallets())])
}

function* fetchBalanceAsync() {
  yield* waitForWrite()
  const walletClient = yield* getContext('walletClient')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')

  const account = yield* select(getAccountUser)
  if (!account) return

  try {
    // Opt out of balance refreshes if the balance
    // is frozen due to a recent optimistic update
    const isBalanceFrozen = yield* call(getIsBalanceFrozen)
    if (isBalanceFrozen) return

    const localBalanceChange: ReturnType<typeof getLocalBalanceDidChange> =
      yield* select(getLocalBalanceDidChange)

    const useSolAudio = yield* call(
      getFeatureEnabled,
      FeatureFlags.ENABLE_SPL_AUDIO
    )

    const [currentEthAudioWeiBalance, currentSolAudioWeiBalance] = yield* all([
      call(
        [walletClient, 'getCurrentBalance'],
        /* bustCache */ localBalanceChange
      ),
      call([walletClient, 'getCurrentWAudioBalance'])
    ])

    if (isNullOrUndefined(currentEthAudioWeiBalance)) {
      console.warn(
        "Failed to fetch and set user's balance - error getting ETH Audio balance."
      )
      yield* put(
        setBalanceError({
          balanceLoadDidFail: true,
          totalBalanceLoadDidFail: true
        })
      )
      return
    }

    const associatedWalletBalance: BNWei | null = yield* call(
      [walletClient, 'getAssociatedWalletBalance'],
      account.user_id,
      /* bustCache */ localBalanceChange
    )
    if (isNullOrUndefined(associatedWalletBalance)) {
      console.warn(
        "Failed to fetch and set user's *total* balance - error getting connected/associated wallet(s) balance."
      )
      yield* put(
        setBalanceError({
          totalBalanceLoadDidFail: true
        })
      )
    }

    if (useSolAudio) {
      if (isNullOrUndefined(currentSolAudioWeiBalance)) {
        console.warn(
          "Failed to fetch and set user's balance - error getting SOL wAudio balance."
        )
        yield* put(
          setBalanceError({
            balanceLoadDidFail: true,
            totalBalanceLoadDidFail: true
          })
        )
        return
      }

      const audioWeiBalance = currentEthAudioWeiBalance.add(
        currentSolAudioWeiBalance!
      ) as BNWei

      const totalBalance = isNullOrUndefined(associatedWalletBalance)
        ? undefined
        : weiToString(audioWeiBalance.add(associatedWalletBalance) as BNWei)
      yield* put(
        setBalance({
          balance: weiToString(audioWeiBalance),
          totalBalance
        })
      )
    } else {
      const totalBalance = isNullOrUndefined(associatedWalletBalance)
        ? undefined
        : weiToString(
            currentEthAudioWeiBalance.add(associatedWalletBalance) as BNWei
          )
      yield* put(
        setBalance({
          balance: weiToString(currentEthAudioWeiBalance),
          totalBalance
        })
      )
    }
  } catch (err) {
    console.error(err)
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error: err as Error,
      additionalInfo: { user_id: account.user_id }
    })
  }
}

/**
 * Check if we can send WAudio to a recipient by checking if they already have
 * an associated WAudio token account, or if they have enough SOL to create one.
 */
function* checkAssociatedTokenAccountOrSol(action: InputSendDataAction) {
  const walletClient = yield* getContext('walletClient')
  const audiusBackend = yield* getContext('audiusBackendInstance')
  const address = action.payload.wallet

  const audiusLibs = yield* call(audiusBackend.getAudiusLibs)
  const connection = (audiusLibs as AudiusLibs).solanaWeb3Manager!.connection

  const associatedTokenAccount = yield* call(
    [walletClient, 'getAssociatedTokenAccountInfo'],
    address
  )
  if (!associatedTokenAccount) {
    const balance: BNWei = yield* call(() =>
      walletClient.getWalletSolBalance(address)
    )

    // TODO: this can become a call to getAssociatedTokenRentExemptionMinimum
    // when the BuyAudio service has been migrated
    const minRentForATA = yield* call(
      [connection, 'getMinimumBalanceForRentExemption'],
      ATA_SIZE,
      'processed'
    )
    const minRentBN = new BN(minRentForATA)
    if (balance.lt(minRentBN)) {
      yield* put(
        setCanRecipientReceiveWAudio({ canRecipientReceiveWAudio: 'false' })
      )
      return
    }
  }
  yield* put(
    setCanRecipientReceiveWAudio({ canRecipientReceiveWAudio: 'true' })
  )
}

function* watchSend() {
  yield* takeEvery(send.type, sendAsync)
}

function* watchGetBalance() {
  yield* takeEvery(getBalance.type, fetchBalanceAsync)
}

function* watchInputSendData() {
  yield* takeEvery(inputSendData.type, checkAssociatedTokenAccountOrSol)
}

function* watchFetchAccountSucceeded() {
  try {
    yield* all([
      take(fetchAccountSucceeded.type),
      take(SETUP_BACKEND_SUCCEEDED)
    ])
    yield* getWalletBalanceAndWallets()
  } catch (err) {
    console.error(err)
  }
}

const sagas = () => {
  return [
    watchGetBalance,
    watchInputSendData,
    watchSend,
    watchFetchAccountSucceeded
  ]
}

export default sagas
