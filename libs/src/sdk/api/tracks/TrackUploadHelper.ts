import type { UploadResponse } from '../../services/Storage/types'
import { decodeHashId } from '../../utils/hashId'
import { BaseAPI } from '../generated/default'
import type { PlaylistTrackMetadata } from '../playlists/types'

export class TrackUploadHelper extends BaseAPI {
  public async generateId(type: 'track' | 'playlist') {
    const response = await this.request({
      path: `/${type}s/unclaimed_id`,
      method: 'GET',
      headers: {},
      query: { noCache: Math.floor(Math.random() * 1000).toString() }
    })

    const { data } = await response.json()
    const id = decodeHashId(data)
    if (id === null) {
      throw new Error(`Could not generate ${type} id`)
    }
    return id
  }

  public transformTrackUploadMetadata(
    // PlaylistTrackMetadata is less strict than TrackMetadata because
    // `genre`, `mood`, and `tags` are optional
    inputMetadata: PlaylistTrackMetadata,
    userId: number
  ) {
    const metadata = {
      ...inputMetadata,
      ownerId: userId
    }

    const isPremium = metadata.isPremium
    const isUnlisted = metadata.isUnlisted

    // If track is premium, set remixes to false
    if (isPremium && metadata.fieldVisibility) {
      metadata.fieldVisibility.remixes = false
    }

    // If track is public, set required visibility fields to true
    if (!isUnlisted) {
      metadata.fieldVisibility = {
        ...metadata.fieldVisibility,
        genre: true,
        mood: true,
        tags: true,
        share: true,
        playCount: true
      }
    }
    return metadata
  }

  public populateTrackMetadataWithUploadResponse(
    trackMetadata: PlaylistTrackMetadata,
    audioResponse: UploadResponse,
    coverArtResponse: UploadResponse
  ) {
    return {
      ...trackMetadata,
      trackSegments: [],
      trackCid: audioResponse.results['320'],
      download: trackMetadata.download?.isDownloadable
        ? {
            ...trackMetadata.download,
            cid: audioResponse.results['320']
          }
        : trackMetadata.download,
      coverArtSizes: coverArtResponse.id,
      duration: parseInt(audioResponse.probe.format.duration, 10)
    }
  }
}