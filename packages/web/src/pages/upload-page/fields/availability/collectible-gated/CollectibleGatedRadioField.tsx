import {
  PremiumConditions,
  TrackAvailabilityType,
  collectiblesSelectors,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated
} from '@audius/common'
import { IconCollectible } from '@audius/stems'

import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { useSelector } from 'utils/reducer'

import { CollectibleGatedDescription } from './CollectibleGatedDescription'
import { CollectibleGatedFields } from './CollectibleGatedFields'

const { getSupportedUserCollections } = collectiblesSelectors

const messages = {
  collectibleGated: 'Collectible Gated',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.'
}

type CollectibleGatedRadioFieldProps = {
  isRemix: boolean
  isUpload?: boolean
  initialPremiumConditions?: PremiumConditions
  isInitiallyUnlisted?: boolean
}

export const CollectibleGatedRadioField = (
  props: CollectibleGatedRadioFieldProps
) => {
  const { isRemix, isUpload, initialPremiumConditions, isInitiallyUnlisted } =
    props

  const hasCollectibles = useSelector((state) => {
    const { ethCollectionMap, solCollectionMap } =
      getSupportedUserCollections(state)

    const numEthCollectibles = Object.keys(ethCollectionMap).length
    const numSolCollectibles = Object.keys(solCollectionMap).length
    return numEthCollectibles + numSolCollectibles > 0
  })

  const isInitiallyPublic =
    !isUpload && !isInitiallyUnlisted && !initialPremiumConditions
  const isInitiallySpecialAccess =
    !isUpload &&
    !!(
      isPremiumContentFollowGated(initialPremiumConditions) ||
      isPremiumContentTipGated(initialPremiumConditions)
    )
  const isInitiallyUsdcGated =
    !isUpload && isPremiumContentUSDCPurchaseGated(initialPremiumConditions)

  const disabled =
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallySpecialAccess ||
    isRemix ||
    !hasCollectibles

  const fieldsDisabled = disabled || (!isUpload && !isInitiallyUnlisted)

  return (
    <ModalRadioItem
      icon={<IconCollectible />}
      label={messages.collectibleGated}
      value={TrackAvailabilityType.COLLECTIBLE_GATED}
      disabled={disabled}
      hintContent={disabled ? messages.noCollectibles : undefined}
      description={
        <CollectibleGatedDescription
          hasCollectibles={hasCollectibles}
          isUpload={true}
        />
      }
      checkedContent={<CollectibleGatedFields disabled={fieldsDisabled} />}
    />
  )
}
