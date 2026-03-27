from __future__ import annotations

import re

from flask import Blueprint, request

from ..core.db import db
from ..core.security import (
    auth_required,
    create_token_pair,
    decode_token,
    hash_password,
    password_strength,
    register_failed_attempt,
    revoke_refresh_token,
    verify_password,
)
from ..models.user import RefreshToken, User, UserRole
from ..seed.bootstrap import AVATARS


auth_bp = Blueprint('auth', __name__)
EMAIL_RE = re.compile(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')


def is_valid_email(value: str) -> bool:
    return bool(EMAIL_RE.fullmatch(value))


@auth_bp.get('/options')
def register_options():
    return {
        'roles': [UserRole.STUDENT.value, UserRole.TEACHER.value],
        'age_groups': ['junior', 'middle', 'senior'],
        'avatars': AVATARS,
    }


@auth_bp.post('/register')
def register():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    role = data.get('role', UserRole.STUDENT.value)

    if role not in {UserRole.STUDENT.value, UserRole.TEACHER.value}:
        return {'message': 'Самостоятельная регистрация доступна только ученикам и учителям.'}, 400
    if not email or not username or len(password) < 6:
        return {'message': 'Заполните email, username и пароль длиной не менее 6 символов.'}, 400
    if not is_valid_email(email):
        return {'message': 'Укажите корректный email.'}, 400
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return {'message': 'Пользователь с таким email или username уже существует.'}, 409

    user = User(
        full_name=data.get('full_name') or username,
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=UserRole(role),
        age_group=data.get('age_group') or 'middle',
        avatar=data.get('avatar') or AVATARS[0],
        companion=data.get('companion') or 'Кодик-робот',
        theme=data.get('theme') or 'light',
    )
    user.touch_login()
    db.session.add(user)
    db.session.commit()
    tokens = create_token_pair(user)
    return {
        'message': 'Регистрация успешна',
        'password_strength': password_strength(password),
        'user': user.to_dict(),
        **tokens,
    }, 201


@auth_bp.post('/login')
def login():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'local')
    if not register_failed_attempt(ip):
        return {'message': 'Слишком много попыток входа. Повторите через минуту.'}, 429

    data = request.get_json() or {}
    login_value = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not is_valid_email(login_value):
        return {'message': 'Укажите корректный email.'}, 400
    user = User.query.filter_by(email=login_value).first()
    if not user or not verify_password(password, user.password_hash):
        return {'message': 'Неверный логин или пароль.'}, 401
    if not user.is_active:
        return {'message': 'Пользователь заблокирован.'}, 403

    user.touch_login()
    db.session.commit()
    tokens = create_token_pair(user)
    return {'message': 'Вход выполнен', 'user': user.to_dict(), **tokens}


@auth_bp.post('/refresh')
def refresh():
    token = (request.get_json() or {}).get('refresh_token', '')
    try:
        payload = decode_token(token)
        if payload.get('type') != 'refresh':
            raise ValueError('Wrong token type')
    except Exception:
        return {'message': 'Недействительный refresh token'}, 401

    refresh_row = RefreshToken.query.filter_by(token_id=payload.get('jti')).first()
    user = User.query.get(int(payload['sub'])) if payload.get('sub') else None
    if not refresh_row or not user or not user.is_active:
        return {'message': 'Refresh token отозван или пользователь недоступен'}, 401

    db.session.delete(refresh_row)
    db.session.commit()
    tokens = create_token_pair(user)
    return {'user': user.to_dict(), **tokens}


@auth_bp.post('/logout')
def logout():
    token = (request.get_json() or {}).get('refresh_token', '')
    revoke_refresh_token(token)
    return {'message': 'Сессия завершена'}


@auth_bp.get('/me')
@auth_required()
def me(current_user: User):
    return {'user': current_user.to_dict()}
