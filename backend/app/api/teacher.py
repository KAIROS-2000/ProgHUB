from __future__ import annotations

from flask import Blueprint, request

from ..core.db import db
from ..core.security import auth_required
from ..models.learning import Assignment, AssignmentSubmission, ClassMembership, Classroom, Lesson, UserProgress
from ..models.user import User, UserRole
from ..seed.bootstrap import generate_code


teacher_bp = Blueprint('teacher', __name__)


def _teacher_classes(current_user: User) -> list[Classroom]:
    return Classroom.query.filter_by(teacher_id=current_user.id).order_by(Classroom.created_at.desc()).all()


@teacher_bp.get('/overview')
@auth_required([UserRole.TEACHER])
def teacher_overview(current_user: User):
    classes = _teacher_classes(current_user)
    total_students = sum(len(item.members) for item in classes)
    total_assignments = sum(len(item.assignments) for item in classes)
    total_submissions = sum(len(assignment.submissions) for classroom in classes for assignment in classroom.assignments)
    return {
        'summary': {
            'classes': len(classes),
            'students': total_students,
            'assignments': total_assignments,
            'submissions': total_submissions,
        },
        'classes': [item.to_dict() for item in classes],
    }


@teacher_bp.post('/classes')
@auth_required([UserRole.TEACHER])
def create_class(current_user: User):
    data = request.get_json() or {}
    classroom = Classroom(
        name=data.get('name', 'Новый класс'),
        description=data.get('description'),
        code=generate_code(),
        teacher_id=current_user.id,
    )
    db.session.add(classroom)
    db.session.commit()
    return {'classroom': classroom.to_dict()}, 201


@teacher_bp.get('/classes')
@auth_required([UserRole.TEACHER])
def list_classes(current_user: User):
    classes = _teacher_classes(current_user)
    return {'classes': [item.to_dict() for item in classes]}


@teacher_bp.get('/classes/<int:classroom_id>')
@auth_required([UserRole.TEACHER])
def class_detail(current_user: User, classroom_id: int):
    classroom = Classroom.query.filter_by(id=classroom_id, teacher_id=current_user.id).first_or_404()
    students = []
    for membership in classroom.members:
        progress_rows = UserProgress.query.filter_by(user_id=membership.student.id).all()
        completed = [row for row in progress_rows if row.status == 'completed']
        students.append({
            'id': membership.student.id,
            'username': membership.student.username,
            'full_name': membership.student.full_name,
            'avatar': membership.student.avatar,
            'xp': membership.student.xp,
            'level': membership.student.level,
            'completed_lessons': len(completed),
            'average_score': round(sum(row.score for row in completed) / len(completed), 1) if completed else 0,
        })
    assignments = [assignment.to_dict() for assignment in classroom.assignments]
    return {'classroom': classroom.to_dict(), 'students': students, 'assignments': assignments}


@teacher_bp.post('/classes/<int:classroom_id>/assignments')
@auth_required([UserRole.TEACHER])
def create_assignment(current_user: User, classroom_id: int):
    classroom = Classroom.query.filter_by(id=classroom_id, teacher_id=current_user.id).first_or_404()
    data = request.get_json() or {}
    assignment = Assignment(
        classroom_id=classroom.id,
        lesson_id=data.get('lesson_id'),
        title=data.get('title', 'Новое задание'),
        description=data.get('description', 'Описание задания'),
        difficulty=data.get('difficulty', 'medium'),
        due_date=data.get('due_date'),
        xp_reward=int(data.get('xp_reward', 80)),
    )
    db.session.add(assignment)
    db.session.commit()
    return {'assignment': assignment.to_dict()}, 201


@teacher_bp.get('/classes/<int:classroom_id>/assignments')
@auth_required([UserRole.TEACHER])
def list_assignments(current_user: User, classroom_id: int):
    classroom = Classroom.query.filter_by(id=classroom_id, teacher_id=current_user.id).first_or_404()
    assignments = []
    for assignment in classroom.assignments:
        submissions = AssignmentSubmission.query.filter_by(assignment_id=assignment.id).all()
        assignments.append({
            **assignment.to_dict(),
            'submissions_count': len(submissions),
            'checked_count': len([row for row in submissions if row.status == 'checked']),
        })
    return {'assignments': assignments}


@teacher_bp.get('/assignments/<int:assignment_id>/submissions')
@auth_required([UserRole.TEACHER])
def assignment_submissions(current_user: User, assignment_id: int):
    assignment = Assignment.query.get_or_404(assignment_id)
    if assignment.classroom.teacher_id != current_user.id:
        return {'message': 'Forbidden'}, 403
    submissions = AssignmentSubmission.query.filter_by(assignment_id=assignment.id).order_by(AssignmentSubmission.submitted_at.desc()).all()
    return {
        'assignment': assignment.to_dict(),
        'submissions': [submission.to_dict() for submission in submissions],
    }


@teacher_bp.patch('/submissions/<int:submission_id>/grade')
@auth_required([UserRole.TEACHER])
def grade_submission(current_user: User, submission_id: int):
    submission = AssignmentSubmission.query.get_or_404(submission_id)
    if submission.assignment.classroom.teacher_id != current_user.id:
        return {'message': 'Forbidden'}, 403
    data = request.get_json() or {}
    submission.score = int(data.get('score', submission.score))
    submission.feedback = data.get('feedback', submission.feedback)
    submission.status = data.get('status', 'checked')
    db.session.commit()
    return {'submission': submission.to_dict()}


@teacher_bp.get('/lesson-catalog')
@auth_required([UserRole.TEACHER])
def lesson_catalog(current_user: User):
    lessons = Lesson.query.order_by(Lesson.id.asc()).all()
    return {'lessons': [lesson.to_summary_dict() for lesson in lessons]}
