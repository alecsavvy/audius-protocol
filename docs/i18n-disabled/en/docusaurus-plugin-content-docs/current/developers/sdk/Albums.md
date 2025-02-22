### getAlbum

#### getAlbum(`params`)

Get an album by id.

Example:

```typescript
const { data: album } = await audiusSdk.album.getAlbum({
  playlistId: "D7KyD",
});

console.log(album);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Description         | Required?    |
| :-------- | :------- | :------------------ | :----------- |
| `albumId` | `string` | The ID of the album | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` contains information about the album as described below.

Return type:

```ts
Promise<{
  data: {
    artwork?: {
      _1000x1000?: string;
      _150x150?: string;
      _480x480?: string;
    };
    coverArtSizes?: string;
    description?: string;
    favoriteCount: number;
    id: string;
    isImageAutogenerated?: boolean;
    isPrivate: boolean;
    permalink?: string;
    playlistContents: {
      metadataTimestamp: number;
      timestamp: number;
      trackId: string;
    };
    playlistName: string;
    repostCount: number;
    totalPlayCount: number;
    user: {
      albumCount: number;
      artistPickTrackId?: string;
      bio?: string;
      coverPhoto?: {
        _2000?: string;
        _640?: string;
      };
      doesFollowCurrentUser?: boolean;
      ercWallet: string;
      followeeCount: number;
      followerCount: number;
      handle: string;
      id: string;
      isAvailable: boolean;
      isDeactivated: boolean;
      isVerified: boolean;
      location?: string;
      name: string;
      playlistCount: number;
      profilePicture?: {
        _1000x1000?: string;
        _150x150?: string;
        _480x480?: string;
      };
      repostCount: number;
      splWallet: string;
      supporterCount: number;
      supportingCount: number;
      totalAudioBalance: number;
      trackCount: number;
    };
  };
}>;
```

---

### getAlbumTracks

#### getAlbumTracks(`params`)

Get the tracks in an album.

Example:

```typescript
const { data: tracks } = await audiusSdk.albums.getAlbumTracks({
  albumId: "D7KyD",
});

console.log(tracks);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Description         | Required?    |
| :-------- | :------- | :------------------ | :----------- |
| `albumId` | `string` | The ID of the album | **Required** |

#### Returns

The return type is the same as [`getBulkTracks`](Tracks#getbulktracks)

---

### uploadAlbum

#### uploadAlbum(`params`, `advancedOptions?`)

Upload an album.

Example:

```typescript
import { Mood, Genre } from "@audius/sdk";
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/cover-art.png");
const trackBuffer1 = fs.readFileSync("path/to/track1.mp3");
const trackBuffer2 = fs.readFileSync("path/to/track2.mp3");
const trackBuffer3 = fs.readFileSync("path/to/track3.mp3");

const { albumId } = await audiusSdk.albums.uploadTrack({
  userId: "7eP5n",
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    albumName: "Songs of the Forest",
    description: "My debut album.",
    genre: Genre.ELECTRONIC,
    mood: Mood.TENDER,
    tags: "nature",
    releaseDate: new Date("2023-07-20"), // Cannot be in the future
  },
  trackMetadatas: [
    {
      title: "Oak",
    },
    {
      title: "Sycamore",
    },
    {
      title: "Bush",
    },
  ],
  trackFiles: [
    {
      buffer: Buffer.from(trackBuffer1),
      name: "OakTrack",
    },
    {
      buffer: Buffer.from(trackBuffer2),
      name: "SycamoreTrack",
    },
    {
      buffer: Buffer.from(trackBuffer3),
      name: "BushTrack",
    },
  ],
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name             | Type                                                                                                                                                                                                                                                                                             | Description                                                                   | Required?    |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :----------- |
| `coverArtFile`   | `File`                                                                                                                                                                                                                                                                                           | A file that will be used as the cover art for the album                       | _Optional_   |
| `metadata`       | <code>{ <br/>&nbsp;&nbsp;genre: Genre;<br/>&nbsp;&nbsp;albumName: string;<br/>&nbsp;&nbsp;description?: string;<br/>&nbsp;&nbsp;license?: string; <br/>&nbsp;&nbsp;mood?: Mood; <br/>&nbsp;&nbsp;releaseDate?: Date; <br/>&nbsp;&nbsp;tags?: string; <br/>&nbsp;&nbsp;upc?: string;<br/>}</code> | An object containing the details of the album                                 | **Required** |
| `onProgress`     | `(progress: number) => void`                                                                                                                                                                                                                                                                     | A function that will be called with progress events as the image file uploads | _Optional_   |
| `trackFiles`     | `Array<File>`                                                                                                                                                                                                                                                                                    | An array of track audio files                                                 | **Required** |
| `trackMetadatas` | [`UploadTrackMetadata`](/developers/UploadTrackMetadata)`[]`                                                                                                                                                                                                                                     | An array of track files                                                       | _Optional_   |
| `userId`         | `string`                                                                                                                                                                                                                                                                                         | The ID of the user                                                            | **Required** |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the new album's ID (`albumId`), as well as the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
  albumId: string;
}>;
```

---

### updateAlbum

#### updateAlbum(`params`, `advancedOptions?`)

Update an album. If cover art or any metadata fields are not provided, their values will be kept the same as before.

Example:

```typescript
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/updated-cover-art.png");

const { albumId } = await audiusSdk.albums.updateAlbum({
  albumId: "x5pJ3Az",
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    description: "The best tracks for Fido... new cover art!",
  },
  onProgress: (progress) => {
    console.log("Progress: ", progress / 100);
  },
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name           | Type                                                                                                                                                                                                                                                                                                                              | Description                                                                   | Required?    |
| :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :----------- |
| `albumId`      | `string`                                                                                                                                                                                                                                                                                                                          | The ID of the album                                                           | **Required** |
| `userId`       | `string`                                                                                                                                                                                                                                                                                                                          | The ID of the User                                                            | **Required** |
| `coverArtFile` | `string`                                                                                                                                                                                                                                                                                                                          | A file that will be used as the cover art for the album                       | _Optional_   |
| `metadata`     | <code>{<br/>&nbsp;&nbsp;albumName?: string;<br/>&nbsp;&nbsp;description?: string;<br/>&nbsp;&nbsp;albumContents?: {trackId: string, time: number}[],<br/>&nbsp;&nbsp;license?: string;<br/>&nbsp;&nbsp;mood?: Mood;<br/>&nbsp;&nbsp;releaseDate?: Date;<br/>&nbsp;&nbsp;tags?: string;<br/>&nbsp;&nbsp;upc?: string;<br/>}</code> | An object containing the details of the album                                 | **Required** |
| `onProgress`   | `(progress: number) => void`                                                                                                                                                                                                                                                                                                      | A function that will be called with progress events as the image file uploads | _Optional_   |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### deleteAlbum

#### deleteAlbum(`params`, `advancedOptions?`)

Delete an album

Example:

```typescript
await audiusSdk.albums.deleteAlbum({
  albumId: "x5pJ3Bo",
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Description         | Required?    |
| :-------- | :------- | :------------------ | :----------- |
| `albumId` | `string` | The ID of the album | **Required** |
| `userId`  | `string` | The ID of the User  | **Required** |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### favoriteAlbum

#### favoriteAlbum(`params`, `advancedOptions?`)

Favorite an album

Example:

```typescript
await audiusSdk.albums.favoriteAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name       | Type                                                         | Description                                     | Required?    |
| :--------- | :----------------------------------------------------------- | :---------------------------------------------- | :----------- |
| `albumId`  | `string`                                                     | The ID of the album                             | **Required** |
| `userId`   | `string`                                                     | The ID of the User                              | **Required** |
| `metadata` | <code>{<br/>&nbsp;&nbsp;isSaveOfRepost: boolean<br/>}</code> | An object containing details about the favorite | _Optional_   |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### unfavoriteAlbum

#### unfavoriteAlbum(`params`, `advancedOptions?`)

Unfavorite an album

Example:

```typescript
await audiusSdk.albums.unfavoriteAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Description         | Required?    |
| :-------- | :------- | :------------------ | :----------- |
| `albumId` | `string` | The ID of the album | **Required** |
| `userId`  | `string` | The ID of the User  | **Required** |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### repostAlbum

#### repostAlbum(`params`, `advancedOptions?`)

Repost a album

Example:

```typescript
await audiusSdk.albums.repostAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name       | Type                                                           | Description                                   | Required?    |
| :--------- | :------------------------------------------------------------- | :-------------------------------------------- | :----------- |
| `albumId`  | `string`                                                       | The ID of the album                           | **Required** |
| `userId`   | `string`                                                       | The ID of the User                            | **Required** |
| `metadata` | <code>{<br/>&nbsp;&nbsp;isRepostOfRepost: boolean<br/>}</code> | An object containing details about the repost | _Optional_   |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### unrepostAlbum

#### unrepostAlbum(`params`, `advancedOptions?`)

Unrepost an album

Example:

```typescript
await audiusSdk.albums.unrepostAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Description         | Required?    |
| :-------- | :------- | :------------------ | :----------- |
| `albumId` | `string` | The ID of the album | **Required** |
| `userId`  | `string` | The ID of the User  | **Required** |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---
