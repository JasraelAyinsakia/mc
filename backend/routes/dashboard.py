from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Application, User, StageHistory, CourtshipProgress, CheckIn
from datetime import datetime, timedelta
from sqlalchemy import func, extract

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    """Get dashboard statistics based on user role"""
    
    # Base query
    query = Application.query
    
    # Filter by role
    if current_user.role == 'single':
        # Singles see only their applications
        query = query.filter_by(applicant_id=current_user.id)
    elif current_user.role == 'committee_member':
        # Committee members see applications from their region
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    
    # Total applications
    total = query.count()
    
    # By status - use Application.status explicitly to avoid ambiguity
    pending = query.filter(Application.status == 'pending').count()
    approved = query.filter(Application.status == 'approved').count()
    rejected = query.filter(Application.status == 'rejected').count()
    on_hold = query.filter(Application.status == 'on_hold').count()
    
    # Recent applications (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent = query.filter(Application.created_at >= thirty_days_ago).count()
    
    # Applications by stage
    stages_query = query.with_entities(
        Application.current_stage,
        func.count(Application.id)
    ).group_by(Application.current_stage).all()
    
    stages_dict = {stage: count for stage, count in stages_query}
    
    # Applications this month
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    this_month = query.filter(
        extract('month', Application.created_at) == current_month,
        extract('year', Application.created_at) == current_year
    ).count()
    
    # My assigned applications (for committee members)
    my_assigned = 0
    if current_user.role in ['committee_member', 'central_committee']:
        my_assigned = Application.query.filter_by(
            assigned_committee_member_id=current_user.id,
            status='pending'
        ).count()
    
    return jsonify({
        'total_applications': total,
        'pending': pending,
        'approved': approved,
        'rejected': rejected,
        'on_hold': on_hold,
        'recent_applications': recent,
        'this_month': this_month,
        'by_stage': stages_dict,
        'my_assigned': my_assigned
    }), 200


@dashboard_bp.route('/recent-activity', methods=['GET'])
@login_required
def get_recent_activity():
    """Get recent activity/updates"""
    limit = request.args.get('limit', 10, type=int)
    
    # Base query for applications
    query = Application.query
    
    # Filter by role
    if current_user.role == 'single':
        query = query.filter_by(applicant_id=current_user.id)
    elif current_user.role == 'committee_member':
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    
    # Get recent applications with their stage history
    applications = query.order_by(Application.updated_at.desc()).limit(limit).all()
    
    activity = []
    for app in applications:
        latest_stage = StageHistory.query.filter_by(
            application_id=app.id
        ).order_by(StageHistory.started_at.desc()).first()
        
        activity.append({
            'application_id': app.id,
            'application_number': app.application_number,
            'applicant_name': app.applicant.full_name,
            'current_stage': app.current_stage,
            'status': app.status,
            'latest_update': latest_stage.started_at.isoformat() if latest_stage else app.updated_at.isoformat(),
            'updated_at': app.updated_at.isoformat()
        })
    
    return jsonify({'activity': activity}), 200


@dashboard_bp.route('/upcoming-checkins', methods=['GET'])
@login_required
def get_upcoming_checkins():
    """Get upcoming check-ins"""
    
    # Base query
    query = CheckIn.query.filter_by(status='scheduled')
    
    # Filter by role
    if current_user.role == 'single':
        query = query.join(Application).filter(
            Application.applicant_id == current_user.id
        )
    elif current_user.role == 'committee_member':
        query = query.join(Application).join(
            User, Application.applicant_id == User.id
        ).filter(User.region == current_user.region)
    
    # Get check-ins for next 30 days
    thirty_days_later = datetime.utcnow() + timedelta(days=30)
    check_ins = query.filter(
        CheckIn.scheduled_date <= thirty_days_later,
        CheckIn.scheduled_date >= datetime.utcnow()
    ).order_by(CheckIn.scheduled_date).all()
    
    results = []
    for check_in in check_ins:
        results.append({
            'id': check_in.id,
            'application_number': check_in.application.application_number,
            'applicant_name': check_in.application.applicant.full_name,
            'scheduled_date': check_in.scheduled_date.isoformat(),
            'days_until': (check_in.scheduled_date - datetime.utcnow()).days
        })
    
    return jsonify({'upcoming_checkins': results}), 200


@dashboard_bp.route('/applications-by-month', methods=['GET'])
@login_required
def get_applications_by_month():
    """Get applications grouped by month (last 12 months)"""
    
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get last 12 months
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    
    query = Application.query.filter(Application.created_at >= twelve_months_ago)
    
    # Filter by region for committee members
    if current_user.role == 'committee_member':
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    
    # Group by month
    results = query.with_entities(
        extract('year', Application.created_at).label('year'),
        extract('month', Application.created_at).label('month'),
        func.count(Application.id).label('count')
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    data = []
    for year, month, count in results:
        data.append({
            'year': int(year),
            'month': int(month),
            'month_name': datetime(int(year), int(month), 1).strftime('%B'),
            'count': count
        })
    
    return jsonify({'data': data}), 200


@dashboard_bp.route('/locations', methods=['GET'])
@login_required
def get_locations():
    """Get available regions and divisions"""
    
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get unique regions
    regions = db.session.query(User.region).distinct().filter(
        User.region.isnot(None)
    ).all()
    
    # Get unique divisions
    divisions = db.session.query(User.division).distinct().filter(
        User.division.isnot(None)
    ).all()
    
    return jsonify({
        'regions': [r[0] for r in regions if r[0]],
        'divisions': [d[0] for d in divisions if d[0]]
    }), 200


@dashboard_bp.route('/courtship-completion', methods=['GET'])
@login_required
def get_courtship_completion():
    """Get courtship completion statistics"""
    
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get applications in courtship
    query = Application.query.filter_by(current_stage='courtship')
    
    # Filter by region for committee members
    if current_user.role == 'committee_member':
        query = query.join(User, Application.applicant_id == User.id).filter(
            User.region == current_user.region
        )
    
    applications = query.all()
    
    results = []
    for app in applications:
        total_topics = CourtshipProgress.query.filter_by(application_id=app.id).count()
        completed_topics = CourtshipProgress.query.filter_by(
            application_id=app.id,
            status='completed'
        ).count()
        
        progress = (completed_topics / total_topics * 100) if total_topics > 0 else 0
        
        results.append({
            'application_number': app.application_number,
            'applicant_name': app.applicant.full_name,
            'total_topics': total_topics,
            'completed_topics': completed_topics,
            'progress': round(progress, 2)
        })
    
    return jsonify({'courtship_data': results}), 200

