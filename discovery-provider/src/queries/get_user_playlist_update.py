import logging
from typing import List

from sqlalchemy.sql import text
from src.utils import db_session

logger = logging.getLogger(__name__)


sql = text(
    """
SELECT
    p.playlist_id
from
    playlists p
INNER JOIN
    saves s ON
        s.save_item_id = p.playlist_id AND
        s.is_current AND
        NOT s.is_delete AND
        s.save_type = 'playlist' AND
        s.user_id = :user_id
LEFT JOIN
  playlist_seen ps ON 
    ps.is_current AND
    ps.playlist_id = p.playlist_id AND
    ps.user_id = :user_id
where
    p.is_current = true AND
    p.is_delete = false AND
    s.created_at < p.updated_at AND 
    (ps.seen_at is NULL OR p.updated_at > ps.seen_at)
"""
)


def get_user_playlist_update(user_id: int) -> List[int]:
    """
    Returns list of playlist_ids for a user_id which have been updated
    and the user has not seen

    Args:
        user_id: int

    Returns:
        List of playlist id
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        rows = session.execute(
            sql,
            {"user_id": user_id},
        )
        playlists_with_updates = [row[0] for row in rows]
        return playlists_with_updates