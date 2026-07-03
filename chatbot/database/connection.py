import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from typing import Any, Dict, List

from config import DB_CONFIG


class DatabasePool:
    def __init__(self):
        self._conn = None

    def get_connection(self):
        if self._conn is None or self._conn.closed:
            self._conn = psycopg2.connect(**DB_CONFIG)
            self._conn.set_session(autocommit=False)
        return self._conn

    def close(self):
        if self._conn and not self._conn.closed:
            self._conn.close()
            self._conn = None

    @contextmanager
    def cursor(self, dict_cursor: bool = False):
        conn = self.get_connection()
        cur = None
        try:
            cur = conn.cursor(
                cursor_factory=psycopg2.extras.RealDictCursor if dict_cursor else None
            )
            yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            if cur:
                cur.close()

    def fetch_all(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        with self.cursor(dict_cursor=True) as cur:
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]

    def fetch_one(self, sql: str, params: tuple = ()) -> Dict[str, Any] | None:
        with self.cursor(dict_cursor=True) as cur:
            cur.execute(sql, params)
            r = cur.fetchone()
            return dict(r) if r else None

    def execute(self, sql: str, params: tuple = ()) -> int:
        with self.cursor() as cur:
            cur.execute(sql, params)
            return cur.rowcount


db = DatabasePool()
