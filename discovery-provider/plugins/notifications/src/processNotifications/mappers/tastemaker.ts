import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import { TastemakerNotification } from '../../types/notifications'
import { BaseNotification, Device } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

type TastemakerNotificationRow = Omit<NotificationRow, 'data'> & {
  data: TastemakerNotification
}
export class Tastemaker extends BaseNotification<TastemakerNotificationRow> {
  receiverUserId: number
  tastemakerItemId: number
  tastemakerType: string
  tastemakerUserId: number
  tastemakerItemOwnerId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: TastemakerNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    const { tastemaker_item_id, tastemaker_item_owner_id, tastemaker_item_type, tastemaker_user_id } = this.notification.data
    this.receiverUserId = userIds[0]
    this.tastemakerItemId = tastemaker_item_id
    this.tastemakerItemOwnerId = tastemaker_item_owner_id
    this.tastemakerType = tastemaker_item_type
    this.tastemakerUserId = tastemaker_user_id
  }

  async pushNotification() {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [
        this.tastemakerUserId,
        this.receiverUserId,
        this.tastemakerItemOwnerId
      ])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = {
        name: user.name,
        isDeactivated: user.is_deactivated
      }
      return acc
    }, {} as Record<number, { name: string; isDeactivated: boolean }>)

    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    const userNotifications = await super.getShouldSendNotification(
      this.receiverUserId
    )

    const track: { track_id: number; title: string } = await this.dnDB
      .select('track_id', 'title')
      .from<TrackRow>('tracks')
      .where('is_current', true)
      .whereIn('track_id', [this.tastemakerItemId])
      .first()

    const entityName = track.title

    const devices: Device[] =
      userNotifications.mobile?.[this.receiverUserId]?.devices

    // If the user has devices to the notification to, proceed
    if (devices && devices.length > 0) {
      // If the user's settings for the reposts notification is set to true, proceed
      await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotifications.mobile[this.receiverUserId].badgeCount + 1,
              targetARN: device.awsARN
            },
            {
              title: `You're a Taste Maker!`,
              body: `${entityName} is now trending thanks to you! Great work 🙌🏽`,
              data: {}
            }
          )
        })
      )
      await this.incrementBadgeCount(this.receiverUserId)
    }

    if (userNotifications.browser) {
      // TODO: Send out browser
    }
    if (userNotifications.email) {
      // TODO: Send out email
    }
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([
        this.receiverUserId,
        this.tastemakerItemOwnerId,
        this.tastemakerUserId
      ]),
      tracks: new Set([this.tastemakerItemId])
    }
  }

  formatEmailProps(resources: Resources) {
    const tastemakerUser = resources.users[this.tastemakerUserId]
    const trackOwnerUser = resources.users[this.tastemakerItemOwnerId]
    const track = resources.tracks[this.tastemakerItemId]

    const entity = {
      type: EntityType.Track,
      name: track.title,
      image: track.imageUrl
    }
    return {
      type: this.notification.type,
      users: [{ name: tastemakerUser.name, image: tastemakerUser.imageUrl }],
      trackOwnerUser,
      entity
    }
  }
}