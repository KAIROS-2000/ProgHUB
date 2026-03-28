from flask import Flask
from flask_cors import CORS

from .api.admin import admin_bp
from .api.auth import auth_bp
from .api.student import student_bp
from .api.teacher import teacher_bp
from .core.config import Config
from .core.db import db
from .seed.bootstrap import seed_all


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if app.config['IS_PRODUCTION'] and app.config['SECRET_KEY'] in {'dev-secret-key', 'super-secret-key-change-me'}:
        raise RuntimeError('Set a strong SECRET_KEY before running in production mode.')

    allowed_origins = [origin.strip() for origin in app.config['CLIENT_URL'].split(',') if origin.strip()]
    if not allowed_origins:
        allowed_origins = ['http://localhost:3000']
    db.init_app(app)
    CORS(app, resources={r'/api/*': {'origins': allowed_origins}}, supports_credentials=True)

    with app.app_context():
        from . import models  # noqa: F401

        db.create_all()
        seed_all(enable_demo_data=app.config['ENABLE_DEMO_DATA'])

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(student_bp, url_prefix='/api')
    app.register_blueprint(teacher_bp, url_prefix='/api/teacher')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.get('/api/health')
    def health():
        return {'status': 'ok'}

    return app
