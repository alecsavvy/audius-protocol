import { Knex } from 'knex'
import { NotificationRow, PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import { RepostOfRepostNotification } from '../../types/notifications'
import { BaseNotification, Device, NotificationSettings } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { EntityType } from '../../email/notifications/types'

type RepostOfRepostNotificationRow = Omit<NotificationRow, 'data'> & {
  data: RepostOfRepostNotification
}
export class RepostOfRepost extends BaseNotification<RepostOfRepostNotificationRow> {
  receiverUserId: number
  repostOfRepostItemId: number
  repostOfRepostType: EntityType
  repostOfRepostUserId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: RepostOfRepostNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.receiverUserId = userIds[0]
    this.repostOfRepostItemId = this.notification.data.repost_of_repost_item_id
    this.repostOfRepostType = this.notification.data.type
    this.repostOfRepostUserId = this.notification.data.user_id
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
      .whereIn('user_id', [this.receiverUserId, this.repostOfRepostUserId])
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
    const reposterUserName = users[this.repostOfRepostUserId]?.name
    let entityType
    let entityName

    if (this.repostOfRepostType === EntityType.Track) {
      const res: Array<{ track_id: number; title: string }> = await this.dnDB
        .select('track_id', 'title')
        .from<TrackRow>('tracks')
        .where('is_current', true)
        .whereIn('track_id', [this.repostOfRepostItemId])
      const tracks = res.reduce((acc, track) => {
        acc[track.track_id] = { title: track.title }
        return acc
      }, {} as Record<number, { title: string }>)

      entityType = EntityType.Track
      entityName = tracks[this.repostOfRepostItemId]?.title
    } else {
      const res: Array<{
        playlist_id: number
        playlist_name: string
        is_album: boolean
      }> = await this.dnDB
        .select('playlist_id', 'playlist_name', 'is_album')
        .from<PlaylistRow>('playlists')
        .where('is_current', true)
        .whereIn('playlist_id', [this.repostOfRepostItemId])
      const playlists = res.reduce((acc, playlist) => {
        acc[playlist.playlist_id] = {
          playlist_name: playlist.playlist_name,
          is_album: playlist.is_album
        }
        return acc
      }, {} as Record<number, { playlist_name: string; is_album: boolean }>)
      const playlist = playlists[this.repostOfRepostItemId]
      entityType = playlist?.is_album ? EntityType.Album : EntityType.Playlist
      entityName = playlist?.playlist_name
    }

    // If the user has devices to the notification to, proceed
    if (
      (userNotifications.mobile?.[this.receiverUserId]?.devices ?? []).length >
      0
    ) {
      const userMobileSettings: NotificationSettings =
        userNotifications.mobile?.[this.receiverUserId].settings
      const devices: Device[] =
        userNotifications.mobile?.[this.receiverUserId].devices
      // If the user's settings for the reposts notification is set to true, proceed
      if (userMobileSettings['reposts']) {
        await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount:
                  userNotifications.mobile[this.receiverUserId].badgeCount,
                targetARN: device.awsARN
              },
              {
                title: 'New Repost',
                body: `${reposterUserName} reposted your repost of ${entityName}`,
                data: {}
              }
            )
          })
        )
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
    if (this.repostOfRepostType === EntityType.Track) {
      tracks.add(this.repostOfRepostItemId)
    } else {
      playlists.add(this.repostOfRepostItemId)
    }

    return {
      users: new Set([this.receiverUserId, this.repostOfRepostUserId]),
      tracks,
      playlists
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.repostOfRepostUserId]
    let entity
    if (this.repostOfRepostType === EntityType.Track) {
      const track = resources.tracks[this.repostOfRepostItemId]
      entity = {
        type: EntityType.Track,
        name: track.title,
        image: track.imageUrl
      }
    } else {
      const playlist = resources.playlists[this.repostOfRepostItemId]
      entity = {
        type: EntityType.Playlist,
        name: playlist.playlist_name,
        image: playlist.imageUrl
      }
    }
    return {
      type: this.notification.type,
      users: [{ name: user.name, image: user.imageUrl }],
      entity
    }
  }
}