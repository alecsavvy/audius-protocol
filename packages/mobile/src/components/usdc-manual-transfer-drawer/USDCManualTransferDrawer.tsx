import { useCallback } from 'react'

import Clipboard from '@react-native-clipboard/clipboard'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-use'

import IconError from 'app/assets/images/iconError.svg'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { Button, Text, useLink } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useToast } from 'app/hooks/useToast'
import { getUSDCUserBank } from 'app/services/buyCrypto'
import { setVisibility } from 'app/store/drawers/slice'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { AddressTile } from '../core/AddressTile'

const USDCLearnMore =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  title: 'Manual Crypto Transfer',
  explainer:
    'You can add funds manually by transferring USDC tokens to your Audius Wallet.\n\n\n Use caution to avoid errors and lost funds.',
  splOnly: 'You can only send Solana based (SPL) USDC tokens to this address.',
  copy: 'Copy Wallet Address',
  goBack: 'Go Back',
  learnMore: 'Learn More',
  copied: 'Copied to Clipboard!'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  drawer: {
    marginVertical: spacing(6),
    marginHorizontal: spacing(4),
    gap: spacing(6)
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    width: '100%',
    paddingBottom: spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  },
  disclaimerContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    backgroundColor: palette.backgroundSurface2,
    borderColor: palette.borderStrong,
    borderWidth: 1,
    borderRadius: spacing(2),
    gap: spacing(4)
  },
  disclaimer: {
    lineHeight: typography.fontSize.medium * 1.25
  },
  icon: {
    marginTop: spacing(2)
  },
  buttonContainer: {
    gap: spacing(2)
  },
  learnMore: {
    textDecorationLine: 'underline'
  },
  explainer: {
    textAlign: 'center',
    lineHeight: typography.fontSize.medium * 1.25
  },
  splContainer: {
    gap: spacing(3),
    flexShrink: 1
  },
  shrink: {
    flexShrink: 1
  }
}))

export const USDCManualTransferDrawer = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { onPress: onPressLearnMore } = useLink(USDCLearnMore)

  const { value: USDCUserBank } = useAsync(async () => {
    const USDCUserBankPubKey = await getUSDCUserBank()
    return USDCUserBankPubKey?.toString() ?? ''
  })

  const handleConfirmPress = useCallback(() => {
    Clipboard.setString(USDCUserBank ?? '')
    toast({ content: messages.copied, type: 'info' })
  }, [USDCUserBank, toast])

  const handleCancelPress = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'USDCManualTransfer',
        visible: 'closing'
      })
    )
  }, [dispatch])

  const handleLearnMorePress = useCallback(() => {
    onPressLearnMore()
  }, [onPressLearnMore])

  return (
    <NativeDrawer drawerName='USDCManualTransfer'>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <Text
            variant='label'
            weight='heavy'
            color='neutralLight2'
            fontSize='xl'
            textTransform='uppercase'
          >
            {messages.title}
          </Text>
        </View>
        <Text style={styles.explainer}>{messages.explainer}</Text>
        <AddressTile
          address={USDCUserBank ?? ''}
          left={<LogoUSDC height={spacing(6)} />}
        />
        <View style={styles.disclaimerContainer}>
          <IconError
            width={spacing(6)}
            height={spacing(6)}
            style={styles.icon}
          />
          <View style={styles.splContainer}>
            <View style={styles.shrink}>
              <Text style={styles.disclaimer}>{messages.splOnly}</Text>
            </View>
            <Text
              style={styles.learnMore}
              color='primary'
              onPress={handleLearnMorePress}
            >
              {messages.learnMore}
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title={messages.copy}
            onPress={handleConfirmPress}
            variant='primary'
            size='large'
            fullWidth
          />
          <Button
            title={messages.goBack}
            onPress={handleCancelPress}
            variant='common'
            size='large'
            fullWidth
          />
        </View>
      </View>
    </NativeDrawer>
  )
}
