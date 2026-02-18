from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .models import AvatarState, Base, EISignal, UserProfile

DATABASE_PATH = Path(__file__).resolve().parent / 'etherea_core.db'
engine = create_engine(f'sqlite:///{DATABASE_PATH}', connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

app = FastAPI(title='Etherea Core API', version='3.0')

EI_LOGGING_ACTIVE = True
SESSION_CACHE: dict[str, str] = {}


class EISignalUpdatePayload(BaseModel):
    user_id: int = Field(default=1)
    wpm: float = Field(ge=0)
    mouse_erraticism: float = Field(ge=0)
    stress: float = Field(ge=0, le=1)


class AvatarStatePayload(BaseModel):
    user_id: int = Field(default=1)
    emotional_state: str
    aura_color: str
    note: str | None = None


def ensure_default_user(db: Session, user_id: int) -> UserProfile:
    user = db.get(UserProfile, user_id)
    if user:
        return user
    user = UserProfile(id=user_id, display_name='Etherea User', signal_access_enabled=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.on_event('startup')
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.post('/api/ei-signals/update')
def update_ei_signal(payload: EISignalUpdatePayload):
    global EI_LOGGING_ACTIVE
    if not EI_LOGGING_ACTIVE:
        raise HTTPException(status_code=423, detail='EI logging is suspended by kill switch.')

    with SessionLocal() as db:
        ensure_default_user(db, payload.user_id)
        signal = EISignal(
            user_id=payload.user_id,
            wpm=payload.wpm,
            mouse_erraticism=payload.mouse_erraticism,
            stress=payload.stress,
            created_at=datetime.utcnow(),
        )
        db.add(signal)
        db.commit()

    return {'status': 'logged'}


@app.post('/api/avatar/state')
def update_avatar_state(payload: AvatarStatePayload):
    with SessionLocal() as db:
        ensure_default_user(db, payload.user_id)
        avatar_state = AvatarState(
            user_id=payload.user_id,
            emotional_state=payload.emotional_state,
            aura_color=payload.aura_color,
            note=payload.note,
            created_at=datetime.utcnow(),
        )
        db.add(avatar_state)
        db.commit()
    return {'status': 'recorded'}


@app.post('/api/security/kill-switch')
def kill_switch():
    global EI_LOGGING_ACTIVE
    EI_LOGGING_ACTIVE = False
    SESSION_CACHE.clear()
    return {
        'status': 'engaged',
        'effects': [
            'AI interventions suspended',
            'EI logging halted',
            'session cache purged',
        ],
    }
