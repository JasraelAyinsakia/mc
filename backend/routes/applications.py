from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Application, StageHistory, User, Notification
from datetime import datetime
import random
import string

applications_bp = Blueprint('applications', __name__)

def generate_application_number():
    """Generate unique application number"""
    year = datetime.now().year
    random_str = ''.join(random.choices(string.digits, k=6))
    return f"DLBC-{year}-{random_str}"


def create_notification(user_id, title, message, notification_type, application_id=None):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        application_id=application_id,
        title=title,
        message=message,
        notification_type=notification_type
    )
    db.session.add(notification)


@applications_bp.route('/', methods=['POST'])
@login_required
def create_application():
    """Create a new marriage application"""
    data = request.get_json()
    
    # Check if user already has an active application
    existing = Application.query.filter_by(
        applicant_id=current_user.id,
        status='pending'
    ).first()
    
    if existing:
        return jsonify({'error': 'You already have an active application'}), 400
    
    # Validate required fields
    required_fields = ['age', 'occupation', 'partner_name', 'is_born_again', 'salvation_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create application
    application = Application(
        application_number=generate_application_number(),
        applicant_id=current_user.id,
        applicant_type='brother' if current_user.gender == 'male' else 'sister',
        age=data['age'],
        occupation=data['occupation'],
        church_role=data.get('church_role', ''),
        partner_name=data['partner_name'],
        partner_location=data.get('partner_location', ''),
        partner_region=data.get('partner_region', ''),
        partner_division=data.get('partner_division', ''),
        partner_informed=data.get('partner_informed', False),
        is_born_again=data['is_born_again'],
        salvation_date=datetime.fromisoformat(data['salvation_date']),
        salvation_experience=data.get('salvation_experience', ''),
        previously_married=data.get('previously_married', False),
        number_of_children=data.get('number_of_children', 0),
        previous_marriage_details=data.get('previous_marriage_details', ''),
        knows_partner=data.get('knows_partner', False),
        relationship_description=data.get('relationship_description', ''),
        current_stage='application_submitted',
        status='pending',
        submitted_at=datetime.utcnow()
    )
    
    # Create initial stage history
    stage = StageHistory(
        application=application,
        stage_name='Application Submitted',
        stage_order=1,
        status='completed',
        actioned_by_id=current_user.id,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    
    # Create next stage
    next_stage = StageHistory(
        application=application,
        stage_name='Form Review',
        stage_order=2,
        status='pending',
        started_at=datetime.utcnow()
    )
    
    try:
        db.session.add(application)
        db.session.add(stage)
        db.session.add(next_stage)
        
        # Notify committee members in the same region
        committee_members = User.query.filter_by(
            role='committee_member',
            region=current_user.region,
            is_active=True
        ).all()
        
        for member in committee_members:
            create_notification(
                member.id,
                'New Marriage Application',
                f'{current_user.full_name} has submitted a marriage application',
                'new_application',
                application.id
            )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Application submission failed', 'details': str(e)}), 500


@applications_bp.route('/', methods=['GET'])
@login_required
def get_applications():
    """Get applications (filtered by role)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Application.query
    
    # Filter based on user role
    if current_user.role == 'single':
        # Singles can only see their own applications
        query = query.filter_by(applicant_id=current_user.id)
    elif current_user.role == 'committee_member':
        # Committee members see applications from their region
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    elif current_user.role in ['central_committee', 'overseer']:
        # Central committee and overseers see all applications
        pass
    
    # Apply filters
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    stage = request.args.get('stage')
    if stage:
        query = query.filter_by(current_stage=stage)
    
    # Search functionality (only for committee members and above)
    search = request.args.get('search')
    if search and current_user.role != 'single':
        # Join with User table if not already joined
        if current_user.role in ['central_committee', 'overseer']:
            query = query.join(User, Application.applicant_id == User.id)
        
        # Search by applicant name, partner name, or application number
        search_filter = db.or_(
            User.full_name.ilike(f'%{search}%'),
            Application.partner_name.ilike(f'%{search}%'),
            Application.application_number.ilike(f'%{search}%')
        )
        query = query.filter(search_filter)
    
    # Order by most recent
    query = query.order_by(Application.created_at.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    applications = [app.to_dict() for app in pagination.items]
    
    return jsonify({
        'applications': applications,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@applications_bp.route('/<int:application_id>', methods=['GET'])
@login_required
def get_application(application_id):
    """Get a specific application"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if current_user.role == 'committee_member':
        if application.applicant.region != current_user.region:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Get stage history
    stages = [stage.to_dict() for stage in application.stage_history]
    
    # Get medical tests
    medical_tests = [test.to_dict() for test in application.medical_tests]
    
    # Get courtship progress
    courtship = [progress.to_dict() for progress in application.courtship_progress_records]
    
    # Get check-ins
    check_ins = [check_in.to_dict() for check_in in application.check_ins]
    
    result = application.to_dict()
    result['stages'] = stages
    result['medical_tests'] = medical_tests
    result['courtship_progress'] = courtship
    result['check_ins'] = check_ins
    
    return jsonify(result), 200


@applications_bp.route('/<int:application_id>', methods=['PUT'])
@login_required
def update_application(application_id):
    """Update an application"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Update allowed fields based on role
    if current_user.role == 'single':
        allowed_fields = ['partner_informed', 'relationship_description']
    else:
        allowed_fields = ['status', 'current_stage', 'admin_notes', 'assigned_committee_member_id']
    
    for field in allowed_fields:
        if field in data:
            setattr(application, field, data[field])
    
    application.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Application updated successfully',
            'application': application.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


@applications_bp.route('/<int:application_id>/stage', methods=['POST'])
@login_required
def update_stage(application_id):
    """Move application to next stage"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    data = request.get_json()
    
    # Get current stage
    current_stage = StageHistory.query.filter_by(
        application_id=application_id,
        status='in_progress'
    ).first()
    
    if not current_stage:
        current_stage = StageHistory.query.filter_by(
            application_id=application_id,
            status='pending'
        ).order_by(StageHistory.stage_order).first()
    
    if not current_stage:
        return jsonify({'error': 'No pending stage found'}), 400
    
    # Update current stage
    current_stage.status = data.get('status', 'completed')
    current_stage.completed_at = datetime.utcnow()
    current_stage.actioned_by_id = current_user.id
    current_stage.notes = data.get('notes', '')
    
    # Create or update next stage
    if data.get('status') == 'completed' and data.get('next_stage'):
        next_stage = StageHistory(
            application_id=application_id,
            stage_name=data['next_stage'],
            stage_order=current_stage.stage_order + 1,
            status='pending',
            started_at=datetime.utcnow()
        )
        db.session.add(next_stage)
        application.current_stage = data['next_stage']
    
    # Notify applicant
    create_notification(
        application.applicant_id,
        'Application Stage Update',
        f'Your application has been updated: {current_stage.stage_name}',
        'stage_update',
        application_id
    )
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Stage updated successfully',
            'application': application.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Stage update failed', 'details': str(e)}), 500

