from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from config import config
from models import db, User
import os

def create_app(config_name=None):
    app = Flask(__name__)
    # Auto-detect environment
    if config_name is None:
        config_name = 'production' if os.environ.get('DATABASE_URL') else 'development'
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, supports_credentials=True, origins=[
        'http://localhost:3001',
        'https://mc-one-tau.vercel.app'
    ])
    
    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Create upload folder if it doesn't exist
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.applications import applications_bp
    from routes.committee import committee_bp
    from routes.courtship import courtship_bp
    from routes.medical import medical_bp
    from routes.dashboard import dashboard_bp
    from routes.notifications import notifications_bp
    from routes.admin import admin_bp
    from routes.meetings import meetings_bp
    from routes.discussions import discussions_bp
    from routes.complaints import complaints_bp
    from routes.courtship_tracking import courtship_tracking_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(committee_bp, url_prefix='/api/committee')
    app.register_blueprint(courtship_bp, url_prefix='/api/courtship')
    app.register_blueprint(medical_bp, url_prefix='/api/medical')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(meetings_bp, url_prefix='/api/meetings')
    app.register_blueprint(discussions_bp, url_prefix='/api/discussions')
    app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
    app.register_blueprint(courtship_tracking_bp, url_prefix='/api/courtship-tracking')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy', 'message': 'Marriage Committee System API'}), 200
    
    return app

# Create app instance for Gunicorn
app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5001, debug=True)

