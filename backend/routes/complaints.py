from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Complaint, Notification, User
from datetime import datetime

complaints_bp = Blueprint('complaints', __name__)


@complaints_bp.route('/', methods=['POST'])
@login_required
def submit_complaint():
    """Submit a new complaint (can be anonymous)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['complaint_type', 'subject', 'description', 'send_to']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create complaint
    complaint = Complaint(
        application_id=data.get('application_id'),
        complaint_type=data['complaint_type'],
        severity=data.get('severity', 'medium'),
        subject=data['subject'],
        description=data['description'],
        send_to=data['send_to'],
        submitted_by_id=current_user.id if not data.get('anonymous', False) else None
    )
    
    try:
        db.session.add(complaint)
        db.session.commit()
        
        # Notify appropriate personnel
        notify_personnel(complaint)
        
        return jsonify({
            'message': 'Complaint submitted successfully. It will be reviewed by the appropriate authority.',
            'complaint': complaint.to_dict(show_submitter=False)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit complaint', 'details': str(e)}), 500


def notify_personnel(complaint):
    """Notify the appropriate personnel about the complaint"""
    # Determine who to notify based on send_to field
    if complaint.send_to == 'central_committee':
        users = User.query.filter_by(role='central_committee', is_active=True).all()
    elif complaint.send_to == 'regional_pastor':
        users = User.query.filter_by(role='overseer', is_active=True).all()
    elif complaint.send_to == 'national_overseer':
        users = User.query.filter_by(role='overseer', is_active=True).all()
    else:
        users = []
    
    # Create notifications
    for user in users:
        notification = Notification(
            user_id=user.id,
            title=f'New {complaint.complaint_type.replace("_", " ").title()} Complaint',
            message=f'Subject: {complaint.subject}',
            notification_type='complaint',
            application_id=complaint.application_id
        )
        db.session.add(notification)
    
    db.session.commit()


@complaints_bp.route('/', methods=['GET'])
@login_required
def get_complaints():
    """Get complaints (only for central committee and overseers)"""
    if current_user.role not in ['central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    send_to = request.args.get('send_to')
    
    query = Complaint.query
    
    # Filter by status
    if status:
        query = query.filter_by(status=status)
    
    # Filter by routing
    if send_to:
        query = query.filter_by(send_to=send_to)
    
    # Order by most recent and severity
    query = query.order_by(
        Complaint.severity == 'urgent',
        Complaint.severity == 'high',
        Complaint.created_at.desc()
    )
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Show submitter info to authorized personnel
    complaints = [c.to_dict(show_submitter=True) for c in pagination.items]
    
    return jsonify({
        'complaints': complaints,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@complaints_bp.route('/<int:complaint_id>', methods=['GET'])
@login_required
def get_complaint(complaint_id):
    """Get a specific complaint"""
    complaint = Complaint.query.get(complaint_id)
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check permissions
    if current_user.role not in ['central_committee', 'overseer']:
        # Users can only view their own complaints
        if complaint.submitted_by_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        return jsonify(complaint.to_dict(show_submitter=False)), 200
    
    # Authorized personnel see full details
    return jsonify(complaint.to_dict(show_submitter=True)), 200


@complaints_bp.route('/<int:complaint_id>', methods=['PUT'])
@login_required
def update_complaint(complaint_id):
    """Update complaint status (central committee and overseers only)"""
    if current_user.role not in ['central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    data = request.get_json()
    
    # Update status
    if 'status' in data:
        complaint.status = data['status']
        
        # If resolving, add resolution details
        if data['status'] in ['resolved', 'dismissed']:
            complaint.resolved_by_id = current_user.id
            complaint.resolved_at = datetime.utcnow()
            
            if 'resolution_notes' in data:
                complaint.resolution_notes = data['resolution_notes']
            
            # Notify the submitter if not anonymous
            if complaint.submitted_by_id:
                notification = Notification(
                    user_id=complaint.submitted_by_id,
                    title='Complaint Update',
                    message=f'Your complaint "{complaint.subject}" has been {data["status"]}',
                    notification_type='complaint_update',
                    application_id=complaint.application_id
                )
                db.session.add(notification)
    
    complaint.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Complaint updated successfully',
            'complaint': complaint.to_dict(show_submitter=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update complaint', 'details': str(e)}), 500


@complaints_bp.route('/my-complaints', methods=['GET'])
@login_required
def get_my_complaints():
    """Get current user's complaints"""
    complaints = Complaint.query.filter_by(submitted_by_id=current_user.id).order_by(
        Complaint.created_at.desc()
    ).all()
    
    return jsonify({
        'complaints': [c.to_dict(show_submitter=False) for c in complaints]
    }), 200

