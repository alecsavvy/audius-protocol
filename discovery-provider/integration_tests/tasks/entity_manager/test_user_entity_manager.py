from typing import List

from integration_tests.challenges.index_helpers import UpdateTask
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.users.user import User
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.entity_manager.utils import USER_ID_OFFSET
from src.utils.db_session import get_db
from web3 import Web3
from web3.datastructures import AttributeDict


def set_patches(mocker):
    mocker.patch(
        "src.tasks.entity_manager.user.get_endpoint_string_from_sp_ids",
        return_value="https://cn.io,https://cn2.io,https://cn3.io",
        autospec=True,
    )

    def fetch_node_info(self, sp_id, sp_type, redis):
        return {
            "operator_wallet": "wallet1",
            "endpoint": "http://endpoint.io",
            "block_number": sp_id,
            "delegator_wallet": f"spid{sp_id}",
        }

    mocker.patch(
        "src.utils.eth_manager.EthManager.fetch_node_info",
        side_effect=fetch_node_info,
        autospec=True,
    )


def test_index_valid_user(app, mocker):
    "Tests valid batch of users create/update/delete actions"

    set_patches(mocker)

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        challenge_event_bus: ChallengeEventBus = setup_challenge_bus()
        update_task = UpdateTask(None, web3, challenge_event_bus)

    tx_receipts = {
        "CreateUser1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET,
                        "_action": "Create",
                        "_metadata": "1,2,3",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "UpdateUser1Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET,
                        "_action": "Update",
                        "_metadata": "QmUpdateUser1",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateUser2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET + 1,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET + 1,
                        "_action": "Create",
                        "_metadata": "2,3,4",
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
        "UpdateUser2Tx": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET + 1,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET + 1,
                        "_action": "Update",
                        "_metadata": "QmCreateUser2",
                        "_signer": "user2wallet",
                    }
                )
            },
        ],
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )
    test_metadata = {
        "QmCreateUser1": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "raymont",
            "handle": "rayjacobson",
            "profile_picture": None,
            "profile_picture_sizes": "QmYRHAJ4YuLjT4fLLRMg5STnQA4yDpiBmzk5R3iCDTmkmk",
            "cover_photo": None,
            "cover_photo_sizes": "QmUk61QDUTzhNqjnCAWipSp3jnMmXBmtTUC2mtF5F6VvUy",
            "bio": "ðŸŒžðŸ‘„ðŸŒž",
            "location": "chik fil yay!!",
            "creator_node_endpoint": "https://creatornode.audius.co,https://content-node.audius.co,https://blockdaemon-audius-content-06.bdnodes.net",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {
                "contents": [
                    {"playlist_id": "Audio NFTs", "type": "explore_playlist"},
                    {"playlist_id": 4327, "type": "playlist"},
                    {"playlist_id": 52792, "type": "playlist"},
                    {"playlist_id": 63949, "type": "playlist"},
                    {
                        "contents": [
                            {"playlist_id": 6833, "type": "playlist"},
                            {"playlist_id": 4735, "type": "playlist"},
                            {"playlist_id": 114799, "type": "playlist"},
                            {"playlist_id": 115049, "type": "playlist"},
                            {"playlist_id": 89495, "type": "playlist"},
                        ],
                        "id": "d515f4db-1db2-41df-9e0c-0180302a24f9",
                        "name": "WIP",
                        "type": "folder",
                    },
                    {
                        "contents": [
                            {"playlist_id": 9616, "type": "playlist"},
                            {"playlist_id": 112826, "type": "playlist"},
                        ],
                        "id": "a0da6552-ddc4-4d13-a19e-ecc63ca23e90",
                        "name": "Community",
                        "type": "folder",
                    },
                    {
                        "contents": [
                            {"playlist_id": 128608, "type": "playlist"},
                            {"playlist_id": 90778, "type": "playlist"},
                            {"playlist_id": 94395, "type": "playlist"},
                            {"playlist_id": 97193, "type": "playlist"},
                        ],
                        "id": "1163fbab-e710-4d33-8769-6fcb02719d7b",
                        "name": "Actually Albums",
                        "type": "folder",
                    },
                    {"playlist_id": 131423, "type": "playlist"},
                    {"playlist_id": 40151, "type": "playlist"},
                ]
            },
            "events": {"is_mobile_user": True},
            "user_id": USER_ID_OFFSET,
        },
        "QmCreateUser2": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "Forrest",
            "handle": "forrest",
            "profile_picture": None,
            "profile_picture_sizes": "QmNmzMoiLYSAgrLbAAnaPW9q3YZwZvHybbbs59QamzUQxg",
            "cover_photo": None,
            "cover_photo_sizes": "QmR2fSFvtpWg7nfdYtoJ3KgDNf4YgcuSzKjwZjansW9wcj",
            "bio": "On the lookout for that next breakout track...   ðŸ‘€",
            "location": "Los Angeles, CA",
            "creator_node_endpoint": "https://creatornode2.audius.co,https://creatornode3.audius.co,https://content-node.audius.co",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {
                "contents": [
                    {"playlist_id": "Audio NFTs", "type": "explore_playlist"},
                    {"playlist_id": 11363, "type": "playlist"},
                    {"playlist_id": 129218, "type": "playlist"},
                ]
            },
            "events": None,
            "user_id": USER_ID_OFFSET + 1,
        },
        "QmUpdateUser1": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "raymont updated",
            "handle": "rayjacobson",
            "profile_picture": None,
            "profile_picture_sizes": "QmYRHAJ4YuLjT4fLLRMg5STnQA4yDpiBmzk5R3iCDTmkmk",
            "cover_photo": None,
            "cover_photo_sizes": "QmUk61QDUTzhNqjnCAWipSp3jnMmXBmtTUC2mtF5F6VvUy",
            "bio": "ðŸŒžðŸ‘„ðŸŒž",
            "location": "chik fil yay!!",
            "creator_node_endpoint": "https://creatornode.audius.co,https://content-node.audius.co,https://blockdaemon-audius-content-06.bdnodes.net",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {
                "contents": [
                    {"playlist_id": "Audio NFTs", "type": "explore_playlist"},
                    {"playlist_id": 4327, "type": "playlist"},
                    {"playlist_id": 52792, "type": "playlist"},
                    {"playlist_id": 63949, "type": "playlist"},
                    {
                        "contents": [
                            {"playlist_id": 6833, "type": "playlist"},
                            {"playlist_id": 4735, "type": "playlist"},
                            {"playlist_id": 114799, "type": "playlist"},
                            {"playlist_id": 115049, "type": "playlist"},
                            {"playlist_id": 89495, "type": "playlist"},
                        ],
                        "id": "d515f4db-1db2-41df-9e0c-0180302a24f9",
                        "name": "WIP",
                        "type": "folder",
                    },
                    {
                        "contents": [
                            {"playlist_id": 9616, "type": "playlist"},
                            {"playlist_id": 112826, "type": "playlist"},
                        ],
                        "id": "a0da6552-ddc4-4d13-a19e-ecc63ca23e90",
                        "name": "Community",
                        "type": "folder",
                    },
                    {
                        "contents": [
                            {"playlist_id": 128608, "type": "playlist"},
                            {"playlist_id": 90778, "type": "playlist"},
                            {"playlist_id": 94395, "type": "playlist"},
                            {"playlist_id": 97193, "type": "playlist"},
                        ],
                        "id": "1163fbab-e710-4d33-8769-6fcb02719d7b",
                        "name": "Actually Albums",
                        "type": "folder",
                    },
                    {"playlist_id": 131423, "type": "playlist"},
                    {"playlist_id": 40151, "type": "playlist"},
                ]
            },
            "events": {"is_mobile_user": True},
            "user_id": USER_ID_OFFSET,
        },
    }

    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
            {"user_id": 2, "handle": "user-1", "wallet": "User2Wallet"},
        ]
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:

        # index transactions
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=1,
            block_timestamp=1585336422,
            block_hash=0,
            metadata=test_metadata,
        )

    with db.scoped_session() as session:

        # validate db records
        all_users: List[User] = session.query(User).all()
        assert len(all_users) == 6

        user_1: User = (
            session.query(User)
            .filter(User.is_current == True, User.user_id == USER_ID_OFFSET)
            .first()
        )
        assert user_1.name == "raymont updated"

        user_2: User = (
            session.query(User)
            .filter(
                User.is_current == True,
                User.user_id == USER_ID_OFFSET + 1,
            )
            .first()
        )
        assert user_2.name == "Forrest"


def test_index_invalid_users(app, mocker):
    "Tests invalid batch of useres create/update/delete actions"
    set_patches(mocker)

    # setup db and mocked txs
    with app.app_context():
        db = get_db()
        web3 = Web3()
        update_task = UpdateTask(None, web3, None)

    tx_receipts = {
        # invalid create
        "CreateUserBelowOffset": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": 1,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateUserWithBadMetadataDoesNotExist": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET + 1,
                        "_entityType": "User",
                        "_userId": 2,
                        "_action": "Create",
                        "_metadata": "QmInvalidUserMetadata",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateUserDoesNotMatchSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET + 1,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Create",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "CreateUser": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET,
                        "_action": "Create",
                        "_metadata": "3,4,5",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        "CreateUserAlreadyExists": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET,
                        "_entityType": "User",
                        "_userId": USER_ID_OFFSET,
                        "_action": "Create",
                        "_metadata": "QmCreateUser1",
                        "_signer": "user1wallet",
                    }
                )
            },
        ],
        # invalid updates
        "UpdateUserInvalidSigner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET,
                        "_entityType": "User",
                        "_userId": 1,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "InvalidWallet",
                    }
                )
            },
        ],
        "UpdateUserInvalidOwner": [
            {
                "args": AttributeDict(
                    {
                        "_entityId": USER_ID_OFFSET,
                        "_entityType": "User",
                        "_userId": 2,
                        "_action": "Update",
                        "_metadata": "",
                        "_signer": "User2Wallet",
                    }
                )
            },
        ],
    }
    test_metadata = {
        "QmCreateUser1": {
            "is_verified": False,
            "is_deactivated": False,
            "name": "raymont",
            "handle": "rayjacobson",
            "profile_picture": None,
            "profile_picture_sizes": "QmYRHAJ4YuLjT4fLLRMg5STnQA4yDpiBmzk5R3iCDTmkmk",
            "cover_photo": None,
            "cover_photo_sizes": "QmUk61QDUTzhNqjnCAWipSp3jnMmXBmtTUC2mtF5F6VvUy",
            "bio": "ðŸŒžðŸ‘„ðŸŒž",
            "location": "chik fil yay!!",
            "creator_node_endpoint": "https://creatornode.audius.co,https://content-node.audius.co,https://blockdaemon-audius-content-06.bdnodes.net",
            "associated_wallets": None,
            "associated_sol_wallets": None,
            "playlist_library": {
                "contents": [
                    {"playlist_id": "Audio NFTs", "type": "explore_playlist"},
                    {"playlist_id": 4327, "type": "playlist"},
                    {"playlist_id": 52792, "type": "playlist"},
                    {"playlist_id": 63949, "type": "playlist"},
                    {
                        "contents": [
                            {"playlist_id": 6833, "type": "playlist"},
                            {"playlist_id": 4735, "type": "playlist"},
                            {"playlist_id": 114799, "type": "playlist"},
                            {"playlist_id": 115049, "type": "playlist"},
                            {"playlist_id": 89495, "type": "playlist"},
                        ],
                        "id": "d515f4db-1db2-41df-9e0c-0180302a24f9",
                        "name": "WIP",
                        "type": "folder",
                    },
                    {
                        "contents": [
                            {"playlist_id": 9616, "type": "playlist"},
                            {"playlist_id": 112826, "type": "playlist"},
                        ],
                        "id": "a0da6552-ddc4-4d13-a19e-ecc63ca23e90",
                        "name": "Community",
                        "type": "folder",
                    },
                    {
                        "contents": [
                            {"playlist_id": 128608, "type": "playlist"},
                            {"playlist_id": 90778, "type": "playlist"},
                            {"playlist_id": 94395, "type": "playlist"},
                            {"playlist_id": 97193, "type": "playlist"},
                        ],
                        "id": "1163fbab-e710-4d33-8769-6fcb02719d7b",
                        "name": "Actually Albums",
                        "type": "folder",
                    },
                    {"playlist_id": 131423, "type": "playlist"},
                    {"playlist_id": 40151, "type": "playlist"},
                ]
            },
            "events": {"is_mobile_user": True},
            "user_id": USER_ID_OFFSET,
        }
    }

    entity_manager_txs = [
        AttributeDict({"transactionHash": update_task.web3.toBytes(text=tx_receipt)})
        for tx_receipt in tx_receipts
    ]

    def get_events_side_effect(_, tx_receipt):
        return tx_receipts[tx_receipt.transactionHash.decode("utf-8")]

    mocker.patch(
        "src.tasks.entity_manager.entity_manager.get_entity_manager_events_tx",
        side_effect=get_events_side_effect,
        autospec=True,
    )
    entities = {
        "users": [
            {"user_id": 1, "handle": "user-1", "wallet": "user1wallet"},
        ]
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # index transactions
        entity_manager_update(
            None,
            update_task,
            session,
            entity_manager_txs,
            block_number=0,
            block_timestamp=1585336422,
            block_hash=0,
            metadata=test_metadata,
        )

        # validate db records
        all_users: List[User] = session.query(User).all()
        assert len(all_users) == 2  # no new users indexed