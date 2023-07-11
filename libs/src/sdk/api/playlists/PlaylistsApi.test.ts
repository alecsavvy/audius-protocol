import { Auth } from '../../services/Auth/Auth'
import { beforeAll, expect, jest } from '@jest/globals'
import { Configuration } from '../generated/default'
import { EntityManager } from '../../services/EntityManager'
import { PlaylistsApi } from './PlaylistsApi'
import { DiscoveryNodeSelector } from '../../services/DiscoveryNodeSelector'
import { StorageNodeSelector } from '../../services/StorageNodeSelector'
import { Storage } from '../../services/Storage'
import { TrackUploadHelper } from '../tracks/TrackUploadHelper'
import { Genre } from '../../types/Genre'
import { Mood } from '../../types/Mood'

jest.mock('../../services/EntityManager')
jest.mock('../../services/DiscoveryNodeSelector')
jest.mock('../../services/StorageNodeSelector')
jest.mock('../../services/Storage')
jest.mock('../tracks/TrackUploadHelper')

jest.spyOn(Storage.prototype, 'uploadFile').mockImplementation(async () => {
  return {
    id: 'a',
    status: 'done',
    results: {
      '320': 'a'
    },
    probe: {
      format: {
        duration: '10'
      }
    }
  }
})

jest
  .spyOn(TrackUploadHelper.prototype, 'generateId' as any)
  .mockImplementation(async () => {
    return 1
  })

jest
  .spyOn(
    TrackUploadHelper.prototype,
    'populateTrackMetadataWithUploadResponse' as any
  )
  .mockImplementation(async () => ({}))

jest
  .spyOn(TrackUploadHelper.prototype, 'transformTrackUploadMetadata' as any)
  .mockImplementation(async () => ({}))

jest
  .spyOn(EntityManager.prototype, 'manageEntity')
  .mockImplementation(async () => {
    return {
      txReceipt: {
        blockHash: 'a',
        blockNumber: 1
      }
    } as any
  })

describe('PlaylistsApi', () => {
  let playlists: PlaylistsApi

  const auth = new Auth()
  const discoveryNodeSelector = new DiscoveryNodeSelector()
  const storageNodeSelector = new StorageNodeSelector({
    auth,
    discoveryNodeSelector
  })

  beforeAll(() => {
    playlists = new PlaylistsApi(
      new Configuration(),
      new Storage({ storageNodeSelector }),
      new EntityManager(),
      auth
    )
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('createPlaylist', () => {
    it('creates a playlist if valid metadata is provided', async () => {
      const result = await playlists.createPlaylist({
        userId: '7eP5n',
        coverArtFile: {
          buffer: Buffer.from([]),
          name: 'coverArt'
        },
        metadata: {
          playlistName: 'My Playlist'
        },
        trackIds: ['yyNwXq7']
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1,
        playlistId: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.createPlaylist({
          userId: '7eP5n',
          coverArtFile: {
            buffer: Buffer.from([]),
            name: 'coverArt'
          },
          metadata: {} as any,
          trackIds: ['yyNwXq7']
        })
      }).rejects.toThrow()
    })
  })

  describe('uploadPlaylist', () => {
    it('uploads a playlist if valid metadata is provided', async () => {
      const result = await playlists.uploadPlaylist({
        userId: '7eP5n',
        coverArtFile: {
          buffer: Buffer.from([]),
          name: 'coverArt'
        },
        metadata: {
          playlistName: 'My Playlist',
          genre: Genre.ELECTRONIC,
          mood: Mood.TENDER
        },
        trackMetadatas: [
          {
            title: 'BachGavotte'
          }
        ],
        trackFiles: [
          {
            buffer: Buffer.from([]),
            name: 'trackArt'
          }
        ]
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1,
        playlistId: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.uploadPlaylist({
          userId: '7eP5n',
          coverArtFile: {
            buffer: Buffer.from([]),
            name: 'coverArt'
          },
          metadata: {
            playlistName: 'My Playlist'
          } as any,
          trackMetadatas: [
            {
              title: 'BachGavotte'
            }
          ],
          trackFiles: [
            {
              buffer: Buffer.from([]),
              name: 'trackArt'
            }
          ]
        })
      }).rejects.toThrow()
    })
  })

  describe('updatePlaylist', () => {
    it('updates a playlist if valid metadata is provided', async () => {
      const result = await playlists.updatePlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj',
        coverArtFile: {
          buffer: Buffer.from([]),
          name: 'coverArt'
        },
        metadata: {
          playlistName: 'My Playlist edited',
          mood: Mood.TENDER,
          playlistContents: []
        }
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.updatePlaylist({
          userId: '7eP5n',
          playlistId: 'x5pJ3Aj',
          coverArtFile: {
            buffer: Buffer.from([]),
            name: 'coverArt'
          },
          metadata: {
            playlistName: 'My Playlist edited',
            mood: Mood.TENDER
          } as any
        })
      }).rejects.toThrow()
    })
  })

  describe('deletePlaylist', () => {
    it('deletes a playlist if valid metadata is provided', async () => {
      const result = await playlists.deletePlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.deletePlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('savePlaylist', () => {
    it('saves a playlist if valid metadata is provided', async () => {
      const result = await playlists.savePlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.savePlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unsavePlaylist', () => {
    it('unsaves a playlist if valid metadata is provided', async () => {
      const result = await playlists.unsavePlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.unsavePlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('repostPlaylist', () => {
    it('reposts a playlist if valid metadata is provided', async () => {
      const result = await playlists.repostPlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.repostPlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unrepostPlaylist', () => {
    it('unreposts a playlist if valid metadata is provided', async () => {
      const result = await playlists.unrepostPlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.unrepostPlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})