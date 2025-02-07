import { useCallback } from 'react'

import type { UserMetadata } from '@audius/common'
import {
  accountSelectors,
  profilePageActions,
  SquareSizes
} from '@audius/common'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { ScrollView } from 'app/components/core'
import { ImageField } from 'app/components/fields'
import { useUserCoverImage } from 'app/components/image/UserCoverImage'
import { useUserImage } from 'app/components/image/UserImage'
import { isImageUriSource } from 'app/hooks/useContentNodeImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import type { Image } from 'app/types/image'

import { FormScreen } from './FormScreen'
import { ProfileTextField } from './ProfileTextField'
import type { ProfileValues, UpdatedProfile } from './types'

const { getAccountUser } = accountSelectors
const { updateProfile } = profilePageActions

const useStyles = makeStyles(({ palette, spacing }) => ({
  coverPhoto: {
    height: 96,
    width: '100%',
    borderRadius: 0,
    aspectRatio: undefined
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    height: 100,
    width: 100,
    borderRadius: 100 / 2,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    backgroundColor: palette.neutralLight4,
    zIndex: 100,
    overflow: 'hidden'
  },
  profilePictureImageContainer: {
    height: 'auto',
    width: 'auto'
  },
  profilePictureImage: {
    width: 'auto'
  },
  textFields: {
    paddingTop: spacing(16)
  }
}))

type EditProfileFormProps = FormikProps<ProfileValues> & {
  isTwitterVerified?: boolean
  isInstagramVerified?: boolean
  isTikTokVerified?: boolean
}

const EditProfileForm = (props: EditProfileFormProps) => {
  const {
    handleSubmit,
    handleReset,
    isTwitterVerified,
    isInstagramVerified,
    isTikTokVerified,
    errors
  } = props
  const styles = useStyles()

  return (
    <FormScreen onReset={handleReset} onSubmit={handleSubmit} errors={errors}>
      <ImageField
        name='cover_photo'
        styles={{ imageContainer: styles.coverPhoto }}
        pickerOptions={{ height: 500, width: 2000, freeStyleCropEnabled: true }}
      />
      <ImageField
        name='profile_picture'
        styles={{
          root: styles.profilePicture,
          imageContainer: styles.profilePictureImageContainer,
          image: styles.profilePictureImage
        }}
        pickerOptions={{
          height: 1000,
          width: 1000,
          cropperCircleOverlay: true
        }}
      />
      <ScrollView style={styles.textFields}>
        <ProfileTextField isFirstInput name='name' label='Name' />
        <ProfileTextField name='bio' label='Bio' multiline maxLength={256} />
        <ProfileTextField name='location' label='Location' />
        <ProfileTextField
          editable={!isTwitterVerified}
          name='twitter_handle'
          label='Twitter Handle'
          prefix='@'
          icon={IconTwitterBird}
        />
        <ProfileTextField
          editable={!isInstagramVerified}
          name='instagram_handle'
          label='Instagram Handle'
          prefix='@'
          icon={IconInstagram}
        />
        <ProfileTextField
          editable={!isTikTokVerified}
          name='tiktok_handle'
          label='TikTok Handle'
          prefix='@'
          icon={IconTikTokInverted}
        />
        <ProfileTextField name='website' label='Website' icon={IconLink} />
        <ProfileTextField name='donation' label='Donation' icon={IconDonate} />
      </ScrollView>
    </FormScreen>
  )
}

export const EditProfileScreen = () => {
  const profile = useSelector(getAccountUser)

  const dispatch = useDispatch()

  const isTwitterVerified = profile ? profile.twitterVerified : false
  const isInstagramVerified = profile ? profile.instagramVerified : false
  const isTikTokVerified = profile ? profile.tikTokVerified : false
  const navigation = useNavigation()

  const { source: coverPhotoSource } = useUserCoverImage(profile)

  const { source: imageSource } = useUserImage({
    user: profile,
    size: SquareSizes.SIZE_480_BY_480
  })

  const handleSubmit = useCallback(
    (values: ProfileValues) => {
      if (!profile) return
      const { cover_photo, profile_picture, ...restValues } = values

      // @ts-ignore typing is hard here, will come back
      const newProfile: UpdatedProfile = {
        ...profile,
        ...restValues
      }
      if (cover_photo.file) {
        newProfile.updatedCoverPhoto = cover_photo
      }

      if (profile_picture.file) {
        newProfile.updatedProfilePicture = profile_picture
      }
      dispatch(updateProfile(newProfile as UserMetadata))
      navigation.goBack()
    },
    [dispatch, navigation, profile]
  )

  if (!profile) return null

  // these values are actually Nullable<string>, but types think they are
  // string | undefined. For now, explicitly casting to null
  const {
    name,
    bio,
    location,
    twitter_handle = null,
    instagram_handle = null,
    tiktok_handle = null,
    website = null,
    donation = null
  } = profile

  const initialValues = {
    name,
    bio,
    location,
    twitter_handle,
    instagram_handle,
    tiktok_handle,
    website,
    donation,
    cover_photo: {
      url: isImageUriSource(coverPhotoSource) ? coverPhotoSource.uri : ''
    } as Image,
    profile_picture: {
      url: isImageUriSource(imageSource) ? imageSource.uri : ''
    } as Image
  }

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {(formikProps) => {
        return (
          <EditProfileForm
            {...formikProps}
            isTwitterVerified={isTwitterVerified}
            isInstagramVerified={isInstagramVerified}
            isTikTokVerified={isTikTokVerified}
          />
        )
      }}
    </Formik>
  )
}
