from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Meeting, Application, Notification
from datetime import datetime
import json

meetings_bp = Blueprint('meetings', __name__)


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


@meetings_bp.route('/applications/<int:application_id>/meetings', methods=['POST'])
@login_required
def schedule_meeting(application_id):
    """Schedule a new meeting for an application"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'scheduled_date', 'meeting_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Parse scheduled date
    try:
        scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Create meeting
    meeting = Meeting(
        application_id=application_id,
        title=data['title'],
        description=data.get('description', ''),
        scheduled_date=scheduled_date,
        duration_minutes=data.get('duration_minutes', 60),
        location=data.get('location', ''),
        meeting_type=data['meeting_type'],
        meeting_format=data.get('meeting_format', 'in_person'),
        attendees=json.dumps(data.get('attendees', [])),
        organized_by_id=current_user.id
    )
    
    try:
        db.session.add(meeting)
        
        # Notify applicant
        create_notification(
            application.applicant_id,
            'Meeting Scheduled',
            f'A {meeting.meeting_type} meeting has been scheduled for {scheduled_date.strftime("%B %d, %Y at %I:%M %p")}',
            'meeting_scheduled',
            application_id
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Meeting scheduled successfully',
            'meeting': meeting.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to schedule meeting', 'details': str(e)}), 500


@meetings_bp.route('/applications/<int:application_id>/meetings', methods=['GET'])
@login_required
def get_meetings(application_id):
    """Get all meetings for an application"""
    application = Application.query.get(application_id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    meetings = Meeting.query.filter_by(application_id=application_id).order_by(Meeting.scheduled_date.desc()).all()
    
    return jsonify({
        'meetings': [meeting.to_dict() for meeting in meetings]
    }), 200


@meetings_bp.route('/meetings/<int:meeting_id>', methods=['GET'])
@login_required
def get_meeting(meeting_id):
    """Get a specific meeting"""
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return jsonify({'error': 'Meeting not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and meeting.application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(meeting.to_dict()), 200


@meetings_bp.route('/meetings/<int:meeting_id>', methods=['PUT'])
@login_required
def update_meeting(meeting_id):
    """Update a meeting"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return jsonify({'error': 'Meeting not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'title' in data:
        meeting.title = data['title']
    if 'description' in data:
        meeting.description = data['description']
    if 'scheduled_date' in data:
        try:
            meeting.scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'Invalid date format'}), 400
    if 'duration_minutes' in data:
        meeting.duration_minutes = data['duration_minutes']
    if 'location' in data:
        meeting.location = data['location']
    if 'meeting_format' in data:
        meeting.meeting_format = data['meeting_format']
    if 'status' in data:
        meeting.status = data['status']
    if 'notes' in data:
        meeting.notes = data['notes']
    if 'outcome' in data:
        meeting.outcome = data['outcome']
    if 'attendees' in data:
        meeting.attendees = json.dumps(data['attendees'])
    
    meeting.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        
        # Notify applicant if status changed
        if 'status' in data or 'scheduled_date' in data:
            create_notification(
                meeting.application.applicant_id,
                'Meeting Updated',
                f'Your {meeting.meeting_type} meeting has been updated',
                'meeting_updated',
                meeting.application_id
            )
            db.session.commit()
        
        return jsonify({
            'message': 'Meeting updated successfully',
            'meeting': meeting.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update meeting', 'details': str(e)}), 500


@meetings_bp.route('/meetings/<int:meeting_id>', methods=['DELETE'])
@login_required
def delete_meeting(meeting_id):
    """Cancel/delete a meeting"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return jsonify({'error': 'Meeting not found'}), 404
    
    try:
        # Notify applicant
        create_notification(
            meeting.application.applicant_id,
            'Meeting Cancelled',
            f'Your {meeting.meeting_type} meeting scheduled for {meeting.scheduled_date.strftime("%B %d, %Y")} has been cancelled',
            'meeting_cancelled',
            meeting.application_id
        )
        
        db.session.delete(meeting)
        db.session.commit()
        
        return jsonify({'message': 'Meeting cancelled successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel meeting', 'details': str(e)}), 500

