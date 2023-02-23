import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { SaveNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

type SaveNotificationRow = Omit<NotificationRow, 'data'> & { data: SaveNotification }
export class Save extends BaseNotification<SaveNotificationRow> {

  receiverUserId: number
  saveItemId: number
  saveType: EntityType
  saverUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: SaveNotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.saveItemId = this.notification.data.save_item_id
    this.saveType = this.notification.data.type
    this.saverUserId = this.notification.data.user_id
  }

  async pushNotification() {

    const res: Array<{ user_id: number, name: string, is_deactivated: boolean }> = await this.dnDB.select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.receiverUserId, this.saverUserId])
    const users = res.reduce((acc, user) => {
      acc[user.user_id] = { name: user.name, isDeactivated: user.is_deactivated }
      return acc
    }, {} as Record<number, { name: string, isDeactivated: boolean }>)


    if (users?.[this.receiverUserId]?.isDeactivated) {
      return
    }

    // TODO: Fetch the tracks or playlist

    // Get the user's notification setting from identity service
    const userNotifications = await super.getShouldSendNotification(this.receiverUserId)

    // If the user has devices to the notification to, proceed
    if ((userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length > 0) {
      const userMobileSettings: NotificationSettings = userNotifications.mobile?.[this.receiverUserId].settings
      const devices: Device[] = userNotifications.mobile?.[this.receiverUserId].devices
      // If the user's settings for the follow notification is set to true, proceed
      if (userMobileSettings['favorites']) {
        await Promise.all(devices.map(device => {
          return sendPushNotification({
            type: device.type,
            badgeCount: userNotifications.mobile[this.receiverUserId].badgeCount,
            targetARN: device.awsARN
          }, {
            title: 'Favorite',
            body: ``,
            data: {}
          })
        }))
        // TODO: increment badge count
      }

    }
    // 

    if (userNotifications.browser) {
      // TODO: Send out browser

    }
    if (userNotifications.email) {
      // TODO: Send out email
    }

  }

  getResourcesForEmail(): ResourceIds {
    const tracks = new Set<number>()
    const playlists = new Set<number>()
    if (this.saveType === EntityType.Track) {
      tracks.add(this.saveItemId)
    } else {
      playlists.add(this.saveItemId)
    }

    return {
      users: new Set([this.receiverUserId, this.saverUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.saverUserId]
    let entity
    if (this.saveType === EntityType.Track) {
      const track = resources.tracks[this.saveItemId]
      entity = { type: EntityType.Track, name: track.title, image: track.imageUrl }
    } else {
      const playlist = resources.playlists[this.saveItemId]
      entity = { type: EntityType.Playlist, name: playlist.playlist_name, image: playlist.imageUrl }
    }
    return {
      type: this.notification.type,
      users: [{ name: user.name, image: user.imageUrl }],
      entity
    }
  }

}