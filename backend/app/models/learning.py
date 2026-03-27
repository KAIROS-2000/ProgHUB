from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.dialects.postgresql import JSONB

from ..core.db import db

JSONType = JSONB().with_variant(db.JSON(), 'sqlite')


class Module(db.Model):
    __tablename__ = 'modules'

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    age_group = db.Column(db.String(20), nullable=False)
    icon = db.Column(db.String(32), nullable=False, default='sparkles')
    color = db.Column(db.String(20), nullable=False, default='#4A90D9')
    order_index = db.Column(db.Integer, nullable=False)
    is_published = db.Column(db.Boolean, nullable=False, default=True)

    lessons = db.relationship('Lesson', back_populates='module', order_by='Lesson.order_index', cascade='all, delete-orphan')

    def to_dict(self, include_lessons: bool = False) -> dict:
        payload = {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'description': self.description,
            'age_group': self.age_group,
            'icon': self.icon,
            'color': self.color,
            'order_index': self.order_index,
            'is_published': self.is_published,
        }
        if include_lessons:
            payload['lessons'] = [lesson.to_summary_dict() for lesson in self.lessons]
        return payload


class Lesson(db.Model):
    __tablename__ = 'lessons'

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    title = db.Column(db.String(140), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    content_format = db.Column(db.String(32), nullable=False, default='mixed')
    theory_blocks = db.Column(JSONType, nullable=False, default=list)
    interactive_steps = db.Column(JSONType, nullable=False, default=list)
    order_index = db.Column(db.Integer, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False, default=10)
    passing_score = db.Column(db.Integer, nullable=False, default=70)
    is_published = db.Column(db.Boolean, nullable=False, default=True)

    module = db.relationship('Module', back_populates='lessons')
    tasks = db.relationship('Task', back_populates='lesson', cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', back_populates='lesson', cascade='all, delete-orphan')
    progress = db.relationship('UserProgress', back_populates='lesson', cascade='all, delete-orphan')

    def to_summary_dict(self) -> dict:
        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'summary': self.summary,
            'duration_minutes': self.duration_minutes,
            'passing_score': self.passing_score,
            'order_index': self.order_index,
        }

    def to_dict(self) -> dict:
        return {
            **self.to_summary_dict(),
            'module': self.module.to_dict(),
            'content_format': self.content_format,
            'theory_blocks': self.theory_blocks,
            'interactive_steps': self.interactive_steps,
            'tasks': [task.to_dict() for task in self.tasks],
            'quizzes': [quiz.to_dict() for quiz in self.quizzes],
        }


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    task_type = db.Column(db.String(32), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    starter_code = db.Column(db.Text, nullable=True)
    validation = db.Column(JSONType, nullable=False, default=dict)
    hints = db.Column(JSONType, nullable=False, default=list)
    xp_reward = db.Column(db.Integer, nullable=False, default=30)

    lesson = db.relationship('Lesson', back_populates='tasks')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'task_type': self.task_type,
            'title': self.title,
            'prompt': self.prompt,
            'starter_code': self.starter_code,
            'validation': self.validation,
            'hints': self.hints,
            'xp_reward': self.xp_reward,
        }


class Quiz(db.Model):
    __tablename__ = 'quizzes'

    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    passing_score = db.Column(db.Integer, nullable=False, default=70)
    questions = db.Column(JSONType, nullable=False, default=list)
    xp_reward = db.Column(db.Integer, nullable=False, default=50)

    lesson = db.relationship('Lesson', back_populates='quizzes')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'passing_score': self.passing_score,
            'questions': self.questions,
            'xp_reward': self.xp_reward,
        }


class Classroom(db.Model):
    __tablename__ = 'classrooms'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    code = db.Column(db.String(12), unique=True, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    teacher = db.relationship('User', back_populates='classes_created')
    assignments = db.relationship('Assignment', back_populates='classroom', cascade='all, delete-orphan')
    members = db.relationship('ClassMembership', back_populates='classroom', cascade='all, delete-orphan')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'code': self.code,
            'teacher_id': self.teacher_id,
            'students_count': len(self.members),
            'assignments_count': len(self.assignments),
        }


class ClassMembership(db.Model):
    __tablename__ = 'class_memberships'

    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    classroom = db.relationship('Classroom', back_populates='members')
    student = db.relationship('User', back_populates='memberships')


class Assignment(db.Model):
    __tablename__ = 'assignments'

    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=True)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, default='medium')
    due_date = db.Column(db.String(40), nullable=True)
    xp_reward = db.Column(db.Integer, nullable=False, default=80)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    classroom = db.relationship('Classroom', back_populates='assignments')
    lesson = db.relationship('Lesson')
    submissions = db.relationship('AssignmentSubmission', back_populates='assignment', cascade='all, delete-orphan')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'classroom_id': self.classroom_id,
            'lesson_id': self.lesson_id,
            'title': self.title,
            'description': self.description,
            'difficulty': self.difficulty,
            'due_date': self.due_date,
            'xp_reward': self.xp_reward,
        }


class AssignmentSubmission(db.Model):
    __tablename__ = 'assignment_submissions'

    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    answer = db.Column(db.Text, nullable=True)
    score = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default='submitted')
    feedback = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    assignment = db.relationship('Assignment', back_populates='submissions')
    student = db.relationship('User')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'student_id': self.student_id,
            'student_username': self.student.username if self.student else None,
            'answer': self.answer,
            'score': self.score,
            'status': self.status,
            'feedback': self.feedback,
            'submitted_at': self.submitted_at.isoformat(),
        }


class UserProgress(db.Model):
    __tablename__ = 'user_progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='not_started')
    score = db.Column(db.Integer, nullable=False, default=0)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    hints_used = db.Column(db.Integer, nullable=False, default=0)
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship('User', back_populates='progress')
    lesson = db.relationship('Lesson', back_populates='progress')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lesson_id': self.lesson_id,
            'status': self.status,
            'score': self.score,
            'attempts': self.attempts,
            'hints_used': self.hints_used,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class Achievement(db.Model):
    __tablename__ = 'achievements'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(60), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(40), nullable=False)
    icon = db.Column(db.String(40), nullable=False)
    xp_reward = db.Column(db.Integer, nullable=False, default=50)

    users = db.relationship('UserAchievement', back_populates='achievement', cascade='all, delete-orphan')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'icon': self.icon,
            'xp_reward': self.xp_reward,
        }


class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    earned_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    user = db.relationship('User', back_populates='achievements')
    achievement = db.relationship('Achievement', back_populates='users')


class ForumPost(db.Model):
    __tablename__ = 'forum_posts'

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(140), nullable=False)
    body = db.Column(db.Text, nullable=False)
    likes = db.Column(db.Integer, nullable=False, default=0)
    thanks = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    author = db.relationship('User', back_populates='posts')
    module = db.relationship('Module')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'module_id': self.module_id,
            'author': self.author.username,
            'title': self.title,
            'body': self.body,
            'likes': self.likes,
            'thanks': self.thanks,
            'created_at': self.created_at.isoformat(),
        }


class ParentInvite(db.Model):
    __tablename__ = 'parent_invites'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    code = db.Column(db.String(32), unique=True, nullable=False, index=True)
    label = db.Column(db.String(80), nullable=False, default='Семейный доступ')
    active = db.Column(db.Boolean, nullable=False, default=True)
    weekly_limit_minutes = db.Column(db.Integer, nullable=True)
    modules_whitelist = db.Column(JSONType, nullable=False, default=list)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    student = db.relationship('User')

    @property
    def is_expired(self) -> bool:
        return bool(self.expires_at and self.expires_at < datetime.now(UTC))

    @classmethod
    def next_month_expiry(cls) -> datetime:
        return datetime.now(UTC) + timedelta(days=30)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'student_id': self.student_id,
            'code': self.code,
            'label': self.label,
            'active': self.active,
            'weekly_limit_minutes': self.weekly_limit_minutes,
            'modules_whitelist': self.modules_whitelist,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat(),
        }
