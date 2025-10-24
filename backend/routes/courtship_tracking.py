from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, CourtshipProgress, Application
from datetime import datetime, timedelta
from courtship_curriculum import COURTSHIP_TOPICS

courtship_tracking_bp = Blueprint('courtship_tracking', __name__)


@courtship_tracking_bp.route('/topics', methods=['GET'])
@login_required
def get_all_topics():
    """Get all 25 weeks of courtship topics"""
    return jsonify({
        'topics': COURTSHIP_TOPICS,
        'total_weeks': len(COURTSHIP_TOPICS)
    }), 200


@courtship_tracking_bp.route('/topics/<int:week>', methods=['GET'])
@login_required
def get_topic_by_week(week):
    """Get specific week's topic content"""
    if week < 1 or week > 25:
        return jsonify({'error': 'Week must be between 1 and 25'}), 400
    
    topic = next((t for t in COURTSHIP_TOPICS if t['week'] == week), None)
    if not topic:
        return jsonify({'error': 'Topic not found'}), 404
    
    return jsonify({'topic': topic}), 200


@courtship_tracking_bp.route('/progress/<int:application_id>', methods=['GET'])
@login_required
def get_progress(application_id):
    """Get courtship progress for an application"""
    # Check if user has access to this application
    application = Application.query.get_or_404(application_id)
    
    if application.applicant_id != current_user.id and application.partner_id != current_user.id:
        if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all progress records for this application
    progress_records = CourtshipProgress.query.filter_by(
        application_id=application_id
    ).order_by(CourtshipProgress.week_number).all()
    
    # Create progress map
    progress_map = {p.week_number: p for p in progress_records}
    
    # Build response with all 25 weeks
    weeks_data = []
    for week_num in range(1, 26):
        topic = next((t for t in COURTSHIP_TOPICS if t['week'] == week_num), None)
        progress = progress_map.get(week_num)
        
        week_data = {
            'week': week_num,
            'topic': topic,
            'progress': progress.to_dict() if progress else {
                'status': 'not_started',
                'notes': None,
                'started_at': None,
                'completed_at': None
            }
        }
        weeks_data.append(week_data)
    
    # Calculate stats
    completed = len([p for p in progress_records if p.status == 'completed'])
    in_progress = len([p for p in progress_records if p.status == 'in_progress'])
    
    return jsonify({
        'application_id': application_id,
        'weeks': weeks_data,
        'stats': {
            'completed': completed,
            'in_progress': in_progress,
            'not_started': 25 - completed - in_progress,
            'total': 25,
            'progress_percentage': round((completed / 25) * 100, 1)
        }
    }), 200


@courtship_tracking_bp.route('/progress/<int:application_id>/week/<int:week>', methods=['POST', 'PUT'])
@login_required
def update_progress(application_id, week):
    """Update progress for a specific week"""
    if week < 1 or week > 25:
        return jsonify({'error': 'Week must be between 1 and 25'}), 400
    
    # Check if user has access
    application = Application.query.get_or_404(application_id)
    
    if application.applicant_id != current_user.id and application.partner_id != current_user.id:
        return jsonify({'error': 'Unauthorized - only the couple can update progress'}), 403
    
    data = request.get_json()
    
    # Get existing progress or create new
    progress = CourtshipProgress.query.filter_by(
        application_id=application_id,
        week_number=week
    ).first()
    
    if not progress:
        progress = CourtshipProgress(
            application_id=application_id,
            week_number=week
        )
        db.session.add(progress)
    
    # Update status if provided
    if 'status' in data:
        new_status = data['status']
        if new_status not in ['not_started', 'in_progress', 'completed']:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Enforce one-topic-per-week rule
        if new_status == 'completed':
            # Check if there's already a completed topic this week
            one_week_ago = datetime.utcnow() - timedelta(days=7)
            recent_completion = CourtshipProgress.query.filter(
                CourtshipProgress.application_id == application_id,
                CourtshipProgress.week_number != week,
                CourtshipProgress.status == 'completed',
                CourtshipProgress.completed_at >= one_week_ago
            ).first()
            
            if recent_completion:
                return jsonify({
                    'error': 'You can only complete one topic per week',
                    'last_completed': {
                        'week': recent_completion.week_number,
                        'completed_at': recent_completion.completed_at.isoformat()
                    }
                }), 400
            
            progress.completed_at = datetime.utcnow()
        
        if new_status == 'in_progress' and not progress.started_at:
            progress.started_at = datetime.utcnow()
        
        progress.status = new_status
    
    # Update notes if provided
    if 'notes' in data:
        progress.notes = data['notes']
        progress.last_updated_by = current_user.id
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Progress updated successfully',
            'progress': progress.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update progress', 'details': str(e)}), 500


@courtship_tracking_bp.route('/progress/<int:application_id>/current', methods=['GET'])
@login_required
def get_current_week(application_id):
    """Get the current week the couple should be working on"""
    # Check access
    application = Application.query.get_or_404(application_id)
    
    if application.applicant_id != current_user.id and application.partner_id != current_user.id:
        if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Find the first incomplete week
    for week_num in range(1, 26):
        progress = CourtshipProgress.query.filter_by(
            application_id=application_id,
            week_number=week_num
        ).first()
        
        if not progress or progress.status != 'completed':
            topic = next((t for t in COURTSHIP_TOPICS if t['week'] == week_num), None)
            return jsonify({
                'current_week': week_num,
                'topic': topic,
                'progress': progress.to_dict() if progress else {
                    'status': 'not_started',
                    'notes': None
                }
            }), 200
    
    # All weeks completed
    return jsonify({
        'current_week': 25,
        'completed': True,
        'message': 'Congratulations! You have completed all 25 weeks of courtship'
    }), 200


@courtship_tracking_bp.route('/progress/<int:application_id>/initialize', methods=['POST'])
@login_required
def initialize_progress(application_id):
    """Initialize all 25 weeks for an application"""
    application = Application.query.get_or_404(application_id)
    
    # Allow the applicant, partner, or committee to initialize
    if application.applicant_id != current_user.id and application.partner_id != current_user.id:
        if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if already initialized
    existing = CourtshipProgress.query.filter_by(application_id=application_id).first()
    if existing:
        return jsonify({'message': 'Progress already initialized'}), 200
    
    # Create all 25 week records
    try:
        for week_num in range(1, 26):
            progress = CourtshipProgress(
                application_id=application_id,
                week_number=week_num,
                status='not_started'
            )
            db.session.add(progress)
        
        db.session.commit()
        return jsonify({'message': 'Successfully initialized 25 weeks of courtship tracking'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to initialize progress', 'details': str(e)}), 500


@courtship_tracking_bp.route('/supervisor-notes', methods=['GET'])
@login_required
def get_supervisor_notes():
    """Get courtship supervisor duties and guidelines"""
    from courtship_curriculum import COURTSHIP_SUPERVISOR_DUTIES
    return jsonify(COURTSHIP_SUPERVISOR_DUTIES), 200

