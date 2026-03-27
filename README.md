# CodeQuest Fullsite v3

Полноценный fullstack‑сайт для обучения программированию по методичке CodeQuest и вашим уточнениям по ролям.

## Что реализовано
- регистрация и вход с JWT access + refresh
- роли: `student`, `teacher`, `admin`, `superadmin`
- суперадмин создаётся автоматически при старте по `.env`
- ученик: dashboard, roadmap, уроки, теория, практика, мини‑тесты, достижения, рейтинг, форум, вступление в класс
- teacher workflow: создание классов, назначение заданий, просмотр учеников, проверка сдач
- админ: просмотр пользователей, создание модулей, публикация и снятие с публикации
- суперадмин: создание, блокировка, разблокировка и удаление обычных админов
- родительский кабинет по семейной ссылке-приглашению
- смешанные тесты: single choice, multiple choice, ordering, matching
- красивый roadmap в стиле path‑based learning: крупные пунсоны-узлы соединены линией, состояния уроков видны визуально
- Docker Compose для фронтенда, бэкенда и PostgreSQL

## Актуальный стек
- Backend: Flask + Flask-SQLAlchemy + PostgreSQL + PyJWT
- Frontend: Next.js + React + Tailwind CSS + GSAP
- Учебные инструменты: Monaco Editor, Blockly

## Быстрый старт
```bash
cp .env.example .env
# отредактировать обязательные значения (SECRET_KEY, SUPERADMIN_PASSWORD и т.д.)

docker compose up --build
```

После запуска:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

## Production режим
- по умолчанию проект запускается в production-конфигурации:
  - `APP_ENV=production`
  - `ENABLE_DEMO_DATA=false`
- фронтенд в Docker собирается через `next build` и запускается через `next start`
- backend стартует без `debug` режима (`FLASK_DEBUG=0`)
- если в `APP_ENV=production` оставлен слабый `SECRET_KEY` (`dev-secret-key` или `super-secret-key-change-me`), backend завершит запуск с ошибкой

## Тестовые данные (только для локальной проверки)
Если нужно поднять демо-аккаунты и тестовые сценарии, добавьте в `.env`:

```env
ENABLE_DEMO_DATA=true
DEMO_STUDENT_EMAIL=student@codequest.local
DEMO_STUDENT_PASSWORD=Student123!
DEMO_TEACHER_EMAIL=teacher@codequest.local
DEMO_TEACHER_PASSWORD=Teacher123!
DEMO_ADMIN_EMAIL=admin@codequest.local
DEMO_ADMIN_PASSWORD=Admin123!
DEMO_CLASS_CODE=CLASS5B
DEMO_PARENT_CODE=PAR-DEMO2026
```

Тогда будут доступны сценарии:
- вход под тестовыми пользователями выше
- вступление ученика в класс по коду `CLASS5B`
- родительский кабинет по адресу `/parent/PAR-DEMO2026`

## Структура
```text
backend/
  app/
    api/        # auth, student, teacher, admin
    core/       # config, db, security, gamification
    models/     # users, modules, lessons, assignments, forum, invites, progress
    seed/       # автосоздание суперадмина и учебного контента
frontend/
  src/app/      # страницы App Router
  src/components/
  src/lib/
```

## Ключевые маршруты API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/dashboard`
- `GET /api/modules`
- `GET /api/lessons/<id>`
- `POST /api/tasks/<id>/submit`
- `POST /api/quizzes/<id>/submit`
- `POST /api/classes/join`
- `POST /api/parent/invite`
- `GET /api/parent/access/<code>`
- `GET /api/teacher/classes`
- `POST /api/teacher/classes/<id>/assignments`
- `PATCH /api/teacher/submissions/<id>/grade`
- `GET /api/admin/overview`
- `POST /api/admin/admins`
- `PATCH /api/admin/admins/<id>/block`
- `DELETE /api/admin/admins/<id>`

## Что можно доработать дальше
- полноценная AST‑проверка Blockly
- песочница исполнения Python/JS в Web Worker
- отдельный профиль‑редактор с аватарами и dark mode
- звуки, confetti, daily chest, weekly leaderboard reset
- миграции Alembic и e2e‑тесты
