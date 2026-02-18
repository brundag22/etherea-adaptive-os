from __future__ import annotations

from typing import Any, Callable


class _SignalInstance:
    def __init__(self) -> None:
        self._slots: list[Callable[..., Any]] = []

    def connect(self, fn: Callable[..., Any]) -> None:
        if callable(fn):
            self._slots.append(fn)

    def emit(self, *args: Any, **kwargs: Any) -> None:
        for fn in list(self._slots):
            try:
                fn(*args, **kwargs)
            except Exception:
                pass


class _SignalDescriptor:
    def __set_name__(self, owner: type, name: str) -> None:
        self._name = f"__sig_{name}"

    def __get__(self, instance: Any, owner: type | None = None) -> Any:
        if instance is None:
            return self
        sig = instance.__dict__.get(self._name)
        if sig is None:
            sig = _SignalInstance()
            instance.__dict__[self._name] = sig
        return sig


try:
    from PySide6.QtCore import QObject, Signal
except Exception:
    class QObject:
        pass

    def Signal(*_args: Any, **_kwargs: Any) -> _SignalDescriptor:  # type: ignore[misc]
        return _SignalDescriptor()
