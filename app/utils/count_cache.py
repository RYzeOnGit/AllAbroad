"""
TTL in-memory cache for count endpoints to reduce repeated DB queries from polling.

- get_cached(key, fetcher, ttl): return cached value if fresh, else await fetcher(), store, return.
- invalidate(key): clear cache so the next request hits the DB.

Cache is process-local. For multi-worker deployments, consider Redis or similar.
Mutations (approve, reject, signup, create_lead, status change) must call invalidate()
so clients see updates without waiting for TTL.
"""
import time
from typing import Any, Awaitable, TypeVar

T = TypeVar("T")

_cache: dict[str, tuple[float, Any]] = {}
_DEFAULT_TTL = 5


async def get_cached(key: str, fetcher: Awaitable[T], ttl: float = _DEFAULT_TTL) -> T:
    now = time.monotonic()
    if key in _cache:
        ts, val = _cache[key]
        if now - ts < ttl:
            return val
    val = await fetcher
    _cache[key] = (now, val)
    return val


def invalidate(key: str) -> None:
    _cache.pop(key, None)
