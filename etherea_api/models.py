from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    signal_access_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    microphone_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    camera_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ei_signals: Mapped[list['EISignal']] = relationship(back_populates='user', cascade='all, delete-orphan')
    avatar_states: Mapped[list['AvatarState']] = relationship(back_populates='user', cascade='all, delete-orphan')


class EISignal(Base):
    __tablename__ = 'ei_signals'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('user_profiles.id'), index=True)
    wpm: Mapped[float] = mapped_column(Float, nullable=False)
    mouse_erraticism: Mapped[float] = mapped_column(Float, nullable=False)
    stress: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped['UserProfile'] = relationship(back_populates='ei_signals')


class AvatarState(Base):
    __tablename__ = 'avatar_states'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('user_profiles.id'), index=True)
    emotional_state: Mapped[str] = mapped_column(String(64), nullable=False)
    aura_color: Mapped[str] = mapped_column(String(16), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped['UserProfile'] = relationship(back_populates='avatar_states')
