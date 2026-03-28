from __future__ import annotations

from flask import Blueprint, request

from ..core.db import db
from ..core.security import auth_required, hash_password
from ..models.learning import ForumPost, Lesson, Module
from ..models.user import User, UserRole


admin_bp = Blueprint('admin', __name__)


@admin_bp.get('/overview')
@auth_required([UserRole.ADMIN, UserRole.SUPERADMIN])
def overview(current_user: User):
    return {
        'stats': {
            'users': User.query.count(),
            'students': User.query.filter_by(role=UserRole.STUDENT).count(),
            'teachers': User.query.filter_by(role=UserRole.TEACHER).count(),
            'modules': Module.query.count(),
            'lessons': Lesson.query.count(),
            'forum_posts': ForumPost.query.count(),
        }
    }


@admin_bp.get('/users')
@auth_required([UserRole.ADMIN, UserRole.SUPERADMIN])
def users(current_user: User):
    payload = [user.to_dict() for user in User.query.order_by(User.created_at.desc()).all()]
    return {'users': payload}


@admin_bp.get('/modules')
@auth_required([UserRole.ADMIN, UserRole.SUPERADMIN])
def list_modules(current_user: User):
    modules = Module.query.order_by(Module.order_index.asc()).all()
    return {'modules': [module.to_dict(include_lessons=True) for module in modules]}


@admin_bp.post('/modules')
@auth_required([UserRole.ADMIN, UserRole.SUPERADMIN])
def create_module(current_user: User):
    data = request.get_json() or {}
    module = Module(
        slug=data.get('slug'),
        title=data.get('title', 'Новый модуль'),
        description=data.get('description', 'Описание модуля'),
        age_group=data.get('age_group', 'middle'),
        icon=data.get('icon', 'sparkles'),
        color=data.get('color', '#4A90D9'),
        order_index=int(data.get('order_index', Module.query.count() + 1)),
        is_published=bool(data.get('is_published', False)),
    )
    db.session.add(module)
    db.session.commit()
    return {'module': module.to_dict()}, 201


@admin_bp.patch('/modules/<int:module_id>')
@auth_required([UserRole.ADMIN, UserRole.SUPERADMIN])
def update_module(current_user: User, module_id: int):
    module = Module.query.get_or_404(module_id)
    data = request.get_json() or {}
    for field in ['title', 'description', 'age_group', 'icon', 'color']:
        if field in data:
            setattr(module, field, data[field])
    if 'is_published' in data:
        module.is_published = bool(data['is_published'])
    db.session.commit()
    return {'module': module.to_dict()}


@admin_bp.post('/admins')
@auth_required([UserRole.SUPERADMIN])
def create_admin(current_user: User):
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email:
        return {'message': 'Укажите email нового администратора.'}, 400
    if len(password) < 8:
        return {'message': 'Пароль администратора должен содержать не менее 8 символов.'}, 400

    username = (data.get('username') or email.split('@')[0]).strip().lower()
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return {'message': 'Пользователь уже существует'}, 409
    admin = User(
        full_name=data.get('full_name', 'Администратор'),
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=UserRole.ADMIN,
        age_group='adult',
        avatar='shield',
        companion='Страж-панели',
        xp=2000,
    )
    db.session.add(admin)
    db.session.commit()
    return {'user': admin.to_dict()}, 201


@admin_bp.patch('/admins/<int:user_id>/block')
@auth_required([UserRole.SUPERADMIN])
def block_admin(current_user: User, user_id: int):
    user = User.query.get_or_404(user_id)
    if user.role != UserRole.ADMIN:
        return {'message': 'Можно блокировать только обычных админов'}, 400
    user.is_active = False
    db.session.commit()
    return {'user': user.to_dict()}


@admin_bp.patch('/admins/<int:user_id>/unblock')
@auth_required([UserRole.SUPERADMIN])
def unblock_admin(current_user: User, user_id: int):
    user = User.query.get_or_404(user_id)
    if user.role != UserRole.ADMIN:
        return {'message': 'Можно разблокировать только обычных админов'}, 400
    user.is_active = True
    db.session.commit()
    return {'user': user.to_dict()}


@admin_bp.delete('/admins/<int:user_id>')
@auth_required([UserRole.SUPERADMIN])
def delete_admin(current_user: User, user_id: int):
    user = User.query.get_or_404(user_id)
    if user.role != UserRole.ADMIN:
        return {'message': 'Можно удалять только обычных админов'}, 400
    db.session.delete(user)
    db.session.commit()
    return {'message': 'Админ удалён'}
