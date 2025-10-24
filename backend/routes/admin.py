from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, User
from datetime import datetime
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator to require admin/central committee role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.role not in ['central_committee', 'overseer']:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/users', methods=['GET'])
@login_required
@admin_required
def get_users():
    """Get all users (admin only)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role_filter = request.args.get('role', '')
    
    query = User.query
    
    if role_filter:
        query = query.filter_by(role=role_filter)
    
    # Order by most recent
    query = query.order_by(User.created_at.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    users = [user.to_dict() for user in pagination.items]
    
    return jsonify({
        'users': users,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    """Create a new user (admin only)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'username', 'password', 'full_name', 'role', 'gender', 'region', 'division', 'local_church']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400
    
    # Validate role
    valid_roles = ['single', 'committee_member', 'central_committee', 'overseer']
    if data['role'] not in valid_roles:
        return jsonify({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
    
    # Create new user
    user = User(
        email=data['email'],
        username=data['username'],
        full_name=data['full_name'],
        phone=data.get('phone'),
        gender=data['gender'],
        region=data['region'],
        division=data['division'],
        local_church=data['local_church'],
        role=data['role'],
        is_active=data.get('is_active', True)
    )
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'User creation failed', 'details': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    """Update a user (admin only)"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['full_name', 'phone', 'region', 'division', 'local_church', 'role', 'is_active']
    
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
    
    user.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@login_required
@admin_required
def reset_user_password(user_id):
    """Reset a user's password (admin only)"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data.get('new_password'):
        return jsonify({'error': 'New password required'}), 400
    
    if len(data['new_password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    user.set_password(data['new_password'])
    user.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'message': 'Password reset successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Password reset failed', 'details': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """Deactivate a user (admin only)"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot deactivate your own account'}), 400
    
    # Instead of deleting, deactivate the user
    user.is_active = False
    user.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({'message': 'User deactivated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Deactivation failed', 'details': str(e)}), 500


@admin_bp.route('/stats/overview', methods=['GET'])
@login_required
@admin_required
def get_admin_stats():
    """Get admin statistics"""
    
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    
    # Users by role
    users_by_role = db.session.query(
        User.role,
        db.func.count(User.id)
    ).group_by(User.role).all()
    
    role_counts = {role: count for role, count in users_by_role}
    
    # Users by region
    users_by_region = db.session.query(
        User.region,
        db.func.count(User.id)
    ).group_by(User.region).all()
    
    region_counts = {region: count for region, count in users_by_region if region}
    
    return jsonify({
        'total_users': total_users,
        'active_users': active_users,
        'by_role': role_counts,
        'by_region': region_counts
    }), 200

