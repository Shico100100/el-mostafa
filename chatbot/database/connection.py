import psycopg2
import psycopg2.extras
import logging
from contextlib import contextmanager
from typing import Any, Dict, List

from config import DB_CONFIG

logger = logging.getLogger(__name__)

KEEPALIVE_KA = 60
KEEPALIVE_IDLE = 30
KEEPALIVE_INTERVAL = 10
KEEPALIVE_COUNT = 5


class DatabasePool:
    def __init__(self):
        self._conn = None

    def _connect(self):
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_session(autocommit=False)
        try:
            conn.set_isolation_level(
                psycopg2.extensions.ISOLATION_LEVEL_DEFAULT
            )
        except Exception:
            pass
        try:
            psycopg2.extensions.set_wait_callback(None)
        except Exception:
            pass
        if hasattr(conn, 'closed') and not conn.closed:
            try:
                conn.execute("SET tcp_keepalives_idle = %s", (KEEPALIVE_IDLE,))
                conn.execute("SET tcp_keepalives_interval = %s", (KEEPALIVE_INTERVAL,))
                conn.execute("SET tcp_keepalives_count = %s", (KEEPALIVE_COUNT,))
            except Exception:
                try:
                    cur = conn.cursor()
                    cur.execute("SET tcp_keepalives_idle = %s", (KEEPALIVE_IDLE,))
                    cur.execute("SET tcp_keepalives_interval = %s", (KEEPALIVE_INTERVAL,))
                    cur.execute("SET tcp_keepalives_count = %s", (KEEPALIVE_COUNT,))
                    conn.commit()
                    cur.close()
                except Exception:
                    pass
        return conn

    def get_connection(self):
        if self._conn is not None and not self._conn.closed:
            try:
                cur = self._conn.cursor()
                cur.execute("SELECT 1")
                cur.close()
                return self._conn
            except Exception:
                logger.warning("Stale connection detected, reconnecting")
                try:
                    self._conn.close()
                except Exception:
                    pass
                self._conn = None

        self._conn = self._connect()
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
        except psycopg2.OperationalError as e:
            logger.error(f"DB operational error: {e}")
            try:
                conn.rollback()
            except Exception:
                pass
            self._conn = None
            raise
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
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
