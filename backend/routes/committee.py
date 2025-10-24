from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Application, User, StageHistory, Notification
from datetime import datetime

committee_bp = Blueprint('committee', __name__)

@committee_bp.route('/applications/pending', methods=['GET'])
@login_required
def get_pending_applications():
    """Get applications pending review by committee"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    query = Application.query.filter_by(status='pending')
    
    # Filter by region for committee members
    if current_user.role == 'committee_member':
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    
    applications = query.order_by(Application.created_at.desc()).all()
    
    return jsonify({
        'applications': [app.to_dict() for app in applications]
    }), 200


@committee_bp.route('/applications/<int:application_id>/assign', methods=['POST'])
@login_required
def assign_application(application_id):
    """Assign application to a committee member"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    data = request.get_json()
    member_id = data.get('committee_member_id')
    
    if not member_id:
        return jsonify({'error': 'Committee member ID required'}), 400
    
    member = User.query.get(member_id)
    if not member or member.role not in ['committee_member', 'central_committee']:
        return jsonify({'error': 'Invalid committee member'}), 400
    
    application.assigned_committee_member_id = member_id
    application.updated_at = datetime.utcnow()
    
    # Create notification
    notification = Notification(
        user_id=member_id,
        application_id=application_id,
        title='Application Assigned',
        message=f'You have been assigned application {application.application_number}',
        notification_type='assignment'
    )
    db.session.add(notification)
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Application assigned successfully',
            'application': application.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Assignment failed', 'details': str(e)}), 500


@committee_bp.route('/applications/<int:application_id>/interview', methods=['POST'])
@login_required
def record_interview(application_id):
    """Record interview results"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    data = request.get_json()
    
    # Find the interview stage
    interview_stage = StageHistory.query.filter_by(
        application_id=application_id,
        stage_name__contains='Interview'
    ).first()
    
    if not interview_stage:
        # Create interview stage
        interview_stage = StageHistory(
            application_id=application_id,
            stage_name=f"{application.applicant_type.capitalize()}'s Interview",
            stage_order=3,
            status='completed',
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            actioned_by_id=current_user.id,
            notes=data.get('notes', '')
        )
        db.session.add(interview_stage)
    else:
        interview_stage.status = 'completed'
        interview_stage.completed_at = datetime.utcnow()
        interview_stage.actioned_by_id = current_user.id
        interview_stage.notes = data.get('notes', '')
    
    # Update application stage
    if data.get('approved', True):
        application.current_stage = 'medical_tests_requested'
        
        # Create medical test stage
        medical_stage = StageHistory(
            application_id=application_id,
            stage_name='Medical Tests Requested',
            stage_order=4,
            status='pending',
            started_at=datetime.utcnow()
        )
        db.session.add(medical_stage)
        
        # Notify applicant
        notification = Notification(
            user_id=application.applicant_id,
            application_id=application_id,
            title='Interview Completed',
            message='Your interview has been completed. Please proceed with medical tests.',
            notification_type='stage_update'
        )
        db.session.add(notification)
    else:
        application.status = 'rejected'
        
        # Notify applicant
        notification = Notification(
            user_id=application.applicant_id,
            application_id=application_id,
            title='Application Update',
            message='Your application requires additional review.',
            notification_type='stage_update'
        )
        db.session.add(notification)
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Interview recorded successfully',
            'application': application.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Recording failed', 'details': str(e)}), 500


@committee_bp.route('/members', methods=['GET'])
@login_required
def get_committee_members():
    """Get list of committee members"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    query = User.query.filter(
        User.role.in_(['committee_member', 'central_committee']),
        User.is_active == True
    )
    
    # Filter by region if committee member
    if current_user.role == 'committee_member':
        query = query.filter_by(region=current_user.region)
    
    members = query.all()
    
    return jsonify({
        'members': [member.to_dict() for member in members]
    }), 200


@committee_bp.route('/statistics', methods=['GET'])
@login_required
def get_statistics():
    """Get committee statistics"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    query = Application.query
    
    # Filter by region for committee members
    if current_user.role == 'committee_member':
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    
    total_applications = query.count()
    pending_applications = query.filter_by(status='pending').count()
    approved_applications = query.filter_by(status='approved').count()
    rejected_applications = query.filter_by(status='rejected').count()
    
    # Applications by stage
    stages = db.session.query(
        Application.current_stage,
        db.func.count(Application.id)
    ).group_by(Application.current_stage).all()
    
    return jsonify({
        'total': total_applications,
        'pending': pending_applications,
        'approved': approved_applications,
        'rejected': rejected_applications,
        'by_stage': {stage: count for stage, count in stages}
    }), 200

