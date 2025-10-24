from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Application, CourtshipProgress, CheckIn, Notification
from datetime import datetime, timedelta

courtship_bp = Blueprint('courtship', __name__)

# 24 Courtship Topics
COURTSHIP_TOPICS = [
    {"week": 1, "title": "Biblical Foundation of Marriage", "description": "Understanding God's design for marriage from Genesis to Revelation"},
    {"week": 2, "title": "Roles and Responsibilities", "description": "Understanding the husband's and wife's biblical roles"},
    {"week": 3, "title": "Communication in Marriage", "description": "Effective communication skills for couples"},
    {"week": 4, "title": "Conflict Resolution", "description": "Biblical approaches to resolving disagreements"},
    {"week": 5, "title": "Financial Management", "description": "Biblical principles of money management in marriage"},
    {"week": 6, "title": "Intimacy and Purity", "description": "Understanding physical intimacy in marriage"},
    {"week": 7, "title": "Spiritual Leadership", "description": "Leading your family spiritually"},
    {"week": 8, "title": "Prayer and Devotion", "description": "Building a prayer life as a couple"},
    {"week": 9, "title": "Family Planning", "description": "Biblical perspective on children and family size"},
    {"week": 10, "title": "In-Laws and Extended Family", "description": "Navigating relationships with extended family"},
    {"week": 11, "title": "Building Trust", "description": "Foundation of trust in marriage"},
    {"week": 12, "title": "Forgiveness and Grace", "description": "Practicing forgiveness in marriage"},
    {"week": 13, "title": "Submission and Love", "description": "Understanding Ephesians 5:22-33"},
    {"week": 14, "title": "Handling Stress Together", "description": "Managing life's pressures as a team"},
    {"week": 15, "title": "Career and Marriage Balance", "description": "Balancing work and family life"},
    {"week": 16, "title": "Sexual Intimacy", "description": "God's design for sexual relationship in marriage"},
    {"week": 17, "title": "Dealing with Infertility", "description": "Trusting God through fertility challenges"},
    {"week": 18, "title": "Parenting Preparation", "description": "Preparing to raise godly children"},
    {"week": 19, "title": "Time Management", "description": "Prioritizing and managing time together"},
    {"week": 20, "title": "Cultural Differences", "description": "Respecting and bridging cultural gaps"},
    {"week": 21, "title": "Maintaining Romance", "description": "Keeping the spark alive in marriage"},
    {"week": 22, "title": "Long-term Vision", "description": "Setting goals and vision for your family"},
    {"week": 23, "title": "Marriage in Ministry", "description": "Serving God together as a couple"},
    {"week": 24, "title": "Wedding Preparation", "description": "Practical preparation for the wedding day"}
]


@courtship_bp.route('/applications/<int:application_id>/initialize', methods=['POST'])
@login_required
def initialize_courtship(application_id):
    """Initialize courtship period with 24 topics"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        if application.applicant_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if already initialized
    existing = CourtshipProgress.query.filter_by(application_id=application_id).first()
    if existing:
        return jsonify({'error': 'Courtship already initialized'}), 400
    
    # Create 24 weekly topics
    progress_items = []
    for topic in COURTSHIP_TOPICS:
        progress = CourtshipProgress(
            application_id=application_id,
            week_number=topic['week'],
            topic_title=topic['title'],
            topic_description=topic['description'],
            status='not_started'
        )
        progress_items.append(progress)
        db.session.add(progress)
    
    # Schedule monthly check-ins (6 months = 6 check-ins)
    start_date = datetime.utcnow()
    for month in range(6):
        check_in_date = start_date + timedelta(days=30 * (month + 1))
        check_in = CheckIn(
            application_id=application_id,
            scheduled_date=check_in_date,
            status='scheduled'
        )
        db.session.add(check_in)
    
    # Update application stage
    application.current_stage = 'courtship'
    
    # Notify couple
    notification = Notification(
        user_id=application.applicant_id,
        application_id=application_id,
        title='Courtship Period Started',
        message='Your 6-month courtship period has begun. Please complete weekly topics.',
        notification_type='courtship_start'
    )
    db.session.add(notification)
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Courtship initialized successfully',
            'topics': [p.to_dict() for p in progress_items]
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Initialization failed', 'details': str(e)}), 500


@courtship_bp.route('/applications/<int:application_id>/topics', methods=['GET'])
@login_required
def get_courtship_topics(application_id):
    """Get courtship topics for an application"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    topics = CourtshipProgress.query.filter_by(
        application_id=application_id
    ).order_by(CourtshipProgress.week_number).all()
    
    return jsonify({
        'topics': [topic.to_dict() for topic in topics]
    }), 200


@courtship_bp.route('/topics/<int:topic_id>', methods=['PUT'])
@login_required
def update_topic(topic_id):
    """Update a courtship topic"""
    topic = CourtshipProgress.query.get(topic_id)
    
    if not topic:
        return jsonify({'error': 'Topic not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and topic.application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Update fields based on role
    if current_user.role == 'single':
        if 'couple_notes' in data:
            topic.couple_notes = data['couple_notes']
        if 'status' in data:
            topic.status = data['status']
        if data.get('status') == 'completed':
            topic.completed_at = datetime.utcnow()
    else:
        # Committee members can add counselor notes
        if 'counselor_notes' in data:
            topic.counselor_notes = data['counselor_notes']
        if 'reviewed' in data:
            topic.reviewed = data['reviewed']
            topic.reviewed_at = datetime.utcnow()
            topic.reviewed_by_id = current_user.id
    
    topic.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Topic updated successfully',
            'topic': topic.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


@courtship_bp.route('/applications/<int:application_id>/checkins', methods=['GET'])
@login_required
def get_check_ins(application_id):
    """Get check-ins for an application"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    check_ins = CheckIn.query.filter_by(
        application_id=application_id
    ).order_by(CheckIn.scheduled_date).all()
    
    return jsonify({
        'check_ins': [check_in.to_dict() for check_in in check_ins]
    }), 200


@courtship_bp.route('/checkins/<int:checkin_id>', methods=['PUT'])
@login_required
def update_check_in(checkin_id):
    """Update a check-in"""
    check_in = CheckIn.query.get(checkin_id)
    
    if not check_in:
        return jsonify({'error': 'Check-in not found'}), 404
    
    data = request.get_json()
    
    # Update fields based on role
    if current_user.role == 'single':
        if 'couple_feedback' in data:
            check_in.couple_feedback = data['couple_feedback']
    else:
        # Committee members can complete the check-in
        if 'status' in data:
            check_in.status = data['status']
        if 'counselor_notes' in data:
            check_in.counselor_notes = data['counselor_notes']
        if 'issues_raised' in data:
            check_in.issues_raised = data['issues_raised']
        if 'action_items' in data:
            check_in.action_items = data['action_items']
        if 'meeting_type' in data:
            check_in.meeting_type = data['meeting_type']
        if data.get('status') == 'completed':
            check_in.completed_date = datetime.utcnow()
            check_in.conducted_by_id = current_user.id
    
    check_in.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Check-in updated successfully',
            'check_in': check_in.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


@courtship_bp.route('/applications/<int:application_id>/progress', methods=['GET'])
@login_required
def get_courtship_progress(application_id):
    """Get overall courtship progress"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Count completed topics
    total_topics = CourtshipProgress.query.filter_by(application_id=application_id).count()
    completed_topics = CourtshipProgress.query.filter_by(
        application_id=application_id,
        status='completed'
    ).count()
    
    # Count completed check-ins
    total_checkins = CheckIn.query.filter_by(application_id=application_id).count()
    completed_checkins = CheckIn.query.filter_by(
        application_id=application_id,
        status='completed'
    ).count()
    
    progress_percentage = (completed_topics / total_topics * 100) if total_topics > 0 else 0
    
    return jsonify({
        'total_topics': total_topics,
        'completed_topics': completed_topics,
        'total_checkins': total_checkins,
        'completed_checkins': completed_checkins,
        'progress_percentage': round(progress_percentage, 2)
    }), 200

