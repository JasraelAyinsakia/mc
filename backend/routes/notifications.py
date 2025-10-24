from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Notification
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@login_required
def get_notifications():
    """Get notifications for current user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    query = Notification.query.filter_by(user_id=current_user.id)
    
    if unread_only:
        query = query.filter_by(read=False)
    
    query = query.order_by(Notification.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    notifications = [notif.to_dict() for notif in pagination.items]
    
    # Get unread count
    unread_count = Notification.query.filter_by(
        user_id=current_user.id,
        read=False
    ).count()
    
    return jsonify({
        'notifications': notifications,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'unread_count': unread_count
    }), 200


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_as_read(notification_id):
    """Mark notification as read"""
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    if notification.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    notification.read = True
    notification.read_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'message': 'Notification marked as read'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


@notifications_bp.route('/mark-all-read', methods=['PUT'])
@login_required
def mark_all_as_read():
    """Mark all notifications as read"""
    notifications = Notification.query.filter_by(
        user_id=current_user.id,
        read=False
    ).all()
    
    for notification in notifications:
        notification.read = True
        notification.read_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'message': f'{len(notifications)} notifications marked as read'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """Delete a notification"""
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    if notification.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'message': 'Notification deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Deletion failed', 'details': str(e)}), 500


@notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    """Get count of unread notifications"""
    count = Notification.query.filter_by(
        user_id=current_user.id,
        read=False
    ).count()
    
    return jsonify({'unread_count': count}), 200

