import json
import logging
from datetime import datetime
from typing import List

import pytest
from web3 import Web3
from web3.datastructures import AttributeDict

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import (
    CHARACTER_LIMIT_DESCRIPTION,
    PLAYLIST_ID_OFFSET,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


@pytest.fixture()
def tx_receipts():
    test_metadata = {
        "QmCreatePlaylist1": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 1",
            "is_image_autogenerated": True,
            "is_private": True,
        },
        "QmCreatePlaylist2": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 2",
        },
        "QmCreatePlaylist4": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 4",
        },
        "QmUpdatePlaylist1": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 1 updated",
            "is_private": False,
        },
        "QmUpdatePlaylist3": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "playlist 3 updated",
            "is_image_autogenerated": True,
        },
        "QmCreateAlbum4": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "album",
            "is_album": True,
        },
    }

    create_playlist1_json = json.dumps(test_metadata["QmCreatePlaylist1"])
    create_playlist2_json = json.dumps(test_metadata["QmCreatePlaylist2"])
    create_playlist4_json = json.dumps(test_metadata["QmCreatePlaylist4"])
    update_playlist1_json = json.dumps(test_metadata["QmUpdatePlaylist1"])
    update_playlist3_json = json.dumps(test_metadata["QmUpdatePlaylist3"])
    create_album4_json = json.dumps(test_metadata["QmCreateAlbum4"])

    return {
        "CreatePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist1", "data": {create_playlist1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist1", "data": {update_playlist1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeletePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist2", "data": {create_playlist2_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist3", "data": {update_playlist3_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateAlbumTx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 3,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateAlbum4", "data": {create_album4_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 4,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist4", "data": {create_playlist4_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist5Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 5,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist5", "data": {create_playlist4_json}}}',
                        "_signer": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
                    }
                )
            },
        ],
    }


@pytest.fixture()
def tx_receipts_update_routes():
    test_metadata = {
        "QmCreatePlaylist1": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist~’",
        },
        "QmCreatePlaylist2": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist 2",
        },
        "QmCreatePlaylist3": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist!!",
        },
        "QmCreatePlaylist4": {
            "playlist_contents": {"track_ids": []},
            "description": "test description",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my ~playlist!!",
        },
        # only updating track, should not insert new slug row
        "QmUpdatePlaylist1": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist",
        },
        "QmUpdatePlaylist12": {
            "playlist_contents": {"track_ids": []},
            "description": "",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist 1 w/ new name!",
        },
        "QmCreatePlaylistDiffOwner": {
            "playlist_contents": {"track_ids": []},
            "description": "test desc",
            "playlist_image_sizes_multihash": "",
            "playlist_name": "my playlist",
        },
    }

    create_playlist1_json = json.dumps(test_metadata["QmCreatePlaylist1"])
    create_playlist2_json = json.dumps(test_metadata["QmCreatePlaylist2"])
    create_playlist3_json = json.dumps(test_metadata["QmCreatePlaylist3"])
    create_playlist4_json = json.dumps(test_metadata["QmCreatePlaylist4"])
    update_playlist1_json = json.dumps(test_metadata["QmUpdatePlaylist1"])
    update_playlist12_json = json.dumps(test_metadata["QmUpdatePlaylist12"])
    create_playlist_diff_owner_json = json.dumps(
        test_metadata["QmCreatePlaylistDiffOwner"]
    )

    return {
        "CreatePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist1", "data": {create_playlist1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist1", "data": {update_playlist1_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdatePlaylist12Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "QmUpdatePlaylist12", "data": {update_playlist12_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist2", "data": {create_playlist2_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist3Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 4,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist3", "data": {create_playlist3_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylist4Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 5,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreatePlaylist4", "data": {create_playlist4_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistDiffOwnerTx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 6,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "QmCreateDiffOwner", "data": {create_playlist_diff_owner_json}}}',
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }


def assert_playlist_route(route, route2):
    assert route.slug == route2.slug
    assert route.title_slug == route2.title_slug
    assert route.collision_id == route2.collision_id
    assert route.owner_id == route2.owner_id
    assert route.playlist_id == route2.playlist_id
    assert route.is_current == route2.is_current


def test_index_valid_playlists_updates_routes(app, mocker, tx_receipts_update_routes):
    "Tests valid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts_update_routes
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts_update_routes[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-2", "wallet": "user2wallet"},
        ],
        "playlists": [],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        playlist_routes = session.query(PlaylistRoute).all()
        assert len(playlist_routes) == 11

        expected_routes = [
            PlaylistRoute(
                slug="my-playlist",
                title_slug="my-playlist",
                collision_id=0,
                owner_id=1,
                playlist_id=400000,
                is_current=False,
            ),
            PlaylistRoute(
                slug="my-playlist-400000",
                title_slug="my-playlist-400000",
                collision_id=0,
                owner_id=1,
                playlist_id=400000,
                is_current=False,
            ),
            PlaylistRoute(
                slug="my-playlist-1-w-new-name",
                title_slug="my-playlist-1-w-new-name",
                collision_id=0,
                owner_id=1,
                playlist_id=400000,
                is_current=True,
            ),
            PlaylistRoute(
                slug="my-playlist-2",
                title_slug="my-playlist-2",
                collision_id=0,
                owner_id=1,
                playlist_id=400001,
                is_current=True,
            ),
            PlaylistRoute(
                slug="my-playlist-2-400001",
                title_slug="my-playlist-2-400001",
                collision_id=0,
                owner_id=1,
                playlist_id=400001,
                is_current=False,
            ),
            PlaylistRoute(
                slug="my-playlist-1",
                title_slug="my-playlist",
                collision_id=1,
                owner_id=1,
                playlist_id=400004,
                is_current=True,
            ),
            PlaylistRoute(
                slug="my-playlist-400004",
                title_slug="my-playlist-400004",
                collision_id=1,
                owner_id=1,
                playlist_id=400004,
                is_current=False,
            ),
            PlaylistRoute(
                slug="my-playlist-3",
                title_slug="my-playlist",
                collision_id=3,
                owner_id=1,
                playlist_id=400005,
                is_current=True,
            ),
            PlaylistRoute(
                slug="my-playlist-400005",
                title_slug="my-playlist-400005",
                collision_id=3,
                owner_id=1,
                playlist_id=400005,
                is_current=False,
            ),
            PlaylistRoute(
                slug="my-playlist",
                title_slug="my-playlist",
                collision_id=0,
                owner_id=2,
                playlist_id=400006,
                is_current=True,
            ),
            PlaylistRoute(
                slug="my-playlist-400006",
                title_slug="my-playlist-400006",
                collision_id=0,
                owner_id=2,
                playlist_id=400006,
                is_current=False,
            ),
        ]

        def sort_key(route):
            return (route.playlist_id, route.slug)

        sorted_routes = sorted(playlist_routes, key=sort_key)
        sorted_expected_routes = sorted(expected_routes, key=sort_key)
        for i in range(len(sorted_routes)):
            assert_playlist_route(sorted_routes[i], sorted_expected_routes[i])


def test_index_valid_playlists(app, mocker, tx_receipts):
    "Tests valid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "playlists": [
            {
                "playlist_id": PLAYLIST_ID_OFFSET + 2,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 3",
            }
        ],
        "developer_apps": [
            {
                "user_id": 2,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
                "is_delete": False,
            },
            {
                "user_id": 2,
                "name": "My App 2",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4ZZ",
            },
        ],
        "grants": [
            {
                "user_id": 1,
                "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
            },
            {
                "user_id": 1,
                "grantee_address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4ZZ",
                "is_revoked": True,
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        all_playlists: List[Playlist] = session.query(Playlist).all()
        assert len(all_playlists) == 6

        playlists_1: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == PLAYLIST_ID_OFFSET
            )
            .all()
        )
        assert len(playlists_1) == 1
        playlist_1 = playlists_1[0]
        assert datetime.timestamp(playlist_1.last_added_to) == 1585336422
        assert playlist_1.playlist_name == "playlist 1 updated"
        assert playlist_1.is_image_autogenerated == True
        assert playlist_1.is_delete == True
        assert playlist_1.is_current == True
        assert playlist_1.is_private == False

        playlists_2: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 1,
            )
            .all()
        )
        assert len(playlists_2) == 1
        playlist_2 = playlists_2[0]
        assert playlist_2.last_added_to == None
        assert playlist_2.playlist_name == "playlist 2"
        assert playlist_2.is_delete == False
        assert playlist_2.is_current == True

        playlists_3: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 2,
            )
            .all()
        )
        assert len(playlists_3) == 1
        playlist_3 = playlists_3[0]
        assert playlist_3.last_added_to == None
        assert playlist_3.playlist_name == "playlist 3 updated"
        assert playlist_3.is_image_autogenerated == True
        assert playlist_3.is_delete == False
        assert playlist_3.is_current == True

        playlists_4: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 4,
            )
            .all()
        )
        assert len(playlists_4) == 1
        playlist_4 = playlists_4[0]
        assert playlist_4.last_added_to == None
        assert playlist_4.playlist_name == "playlist 4"
        assert playlist_4.is_delete == False
        assert playlist_4.is_current == True

        playlists_5: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 5,
            )
            .all()
        )
        assert len(playlists_5) == 1

        albums: List[Playlist] = (
            session.query(Playlist)
            .filter(Playlist.is_current == True, Playlist.is_album == True)
            .all()
        )
        assert len(albums) == 1
        album = albums[0]
        assert datetime.timestamp(album.last_added_to) == 1585336422
        assert album.playlist_name == "album"
        assert album.is_delete == False
        assert album.is_current == True


def test_index_invalid_playlists(app, mocker):
    "Tests invalid batch of playlists create/update/delete actions"

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(web3, challenge_event_bus)

    test_metadata = {
        "UpdatePlaylistInvalidPrivate": {"is_private": True},
        "AlbumTracklistUpdate": {
            "playlist_contents": {"track_ids": [{"track": 1, "time": 1}]}
        },
        "UpdatePlaylistInvalidAlbum": {"is_album": True},
        "CreatePlaylistInvalidTracks": {
            "playlist_contents": {"track_ids": [{"track": 1}]}
        },
    }
    private_metadata = json.dumps(test_metadata["UpdatePlaylistInvalidPrivate"])
    album_metadata = json.dumps(test_metadata["UpdatePlaylistInvalidAlbum"])
    album_tracklist_update_json = json.dumps(test_metadata["AlbumTracklistUpdate"])
    playlist_metadata = json.dumps(test_metadata["CreatePlaylistInvalidTracks"])

    tx_receipts = {
        # invalid create
        "CreatePlaylistBelowOffset": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistUserDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistUserDoesNotMatchSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "CreatePlaylistRevokedAuthorizedApp": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 2,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4ZZ",
                    }
                )
            },
        ],
        "CreatePlaylistAlreadyExists": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreatePlaylistInvalidTracks": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "CreatePlaylistInvalidTracks", "data": {playlist_metadata}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # invalid updates
        "UpdatePlaylistInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "UpdatePlaylistInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "User2Wallet",
                    }
                )
            },
        ],
        "UpdatePlaylistInvalidPrivate": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "UpdatePlaylistInvalidPrivate", "data": {private_metadata}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdateAlbumTracklistUpdate": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "AlbumTracklistUpdate", "data": {album_tracklist_update_json}}}',
                        "_signer": "user1wallet",
                    }
                )
            }
        ],
        "UpdatePlaylistInvalidAlbum": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": f'{{"cid": "UpdatePlaylistInvalidAlbum", "data": {album_metadata}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # invalid deletes
        "DeletePlaylistInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Delete",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "DeletePlaylistDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "DeletePlaylistInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 1,
                        "_entityType": "Playlist",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "User2Wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-1", "wallet": "User2Wallet"},
        ],
        "playlists": [
            {"playlist_id": PLAYLIST_ID_OFFSET, "playlist_owner_id": 1},
            {
                "playlist_id": PLAYLIST_ID_OFFSET + 1,
                "playlist_owner_id": 1,
                "is_album": True,
            },
        ],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        # validate db records
        all_playlists: List[Playlist] = session.query(Playlist).all()
        assert len(all_playlists) == 2

        current_playlist: Playlist = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == PLAYLIST_ID_OFFSET
            )
            .first()
        )
        assert current_playlist.is_current == True
        assert current_playlist.is_private == False
        assert current_playlist.is_album == False

        current_album: Playlist = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.playlist_id == PLAYLIST_ID_OFFSET + 1,
            )
            .first()
        )
        assert current_album.is_current == True
        assert current_album.is_album == True
        assert current_album.playlist_contents == {"track_ids": []}


def test_invalid_playlist_description(app, mocker):
    "Tests that playlists cant have a description that's too long"
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(web3, None, None, None)

    metadata = {
        "PlaylistInvalidDescriptionMetadata": {
            "playlist_contents": {"track_ids": [{"time": 1660927554, "track": 1}]},
            "description": "xtralargeplz" * CHARACTER_LIMIT_DESCRIPTION,
            "playlist_image_sizes_multihash": "",
            "is_album": False,
        },
    }
    metadata = json.dumps(metadata["PlaylistInvalidDescriptionMetadata"])

    tx_receipts = {
        "PlaylistInvalidDescription": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": PLAYLIST_ID_OFFSET + 4,
                        "_entityType": "Playlist",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": f'{{"cid": "PlaylistInvalidDescriptionMetadata", "data": {metadata}}}',
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.to_bytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt["transactionHash"].decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ],
        "playlist": [
            {"playlist_id": 1, "playlist_owner_id": 1, "is_album": True},
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        total_changes, _ = entity_manager_update(
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=hex(0),
        )

        assert total_changes == 0
