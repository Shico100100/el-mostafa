"""
Maps detected intents to executable action functions.
"""

from typing import Any, Dict, Callable, Awaitable

ActionFunc = Callable[[Dict[str, Any], int], Awaitable[str]]

_registry: Dict[str, ActionFunc] = {}


def register(intent: str):
    """Decorator to register an action handler for a given intent."""
    def wrapper(func: ActionFunc):
        _registry[intent] = func
        return func
    return wrapper


def get_handler(intent: str) -> ActionFunc | None:
    return _registry.get(intent)


def list_intents() -> list[str]:
    return list(_registry.keys())
