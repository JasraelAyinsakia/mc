from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Discussion, DiscussionReply, Notification
from datetime import datetime

discussions_bp = Blueprint('discussions', __name__)


def can_view_discussion(discussion, user):
    """Check if user can view a discussion based on visibility settings"""
    if user.role in ['central_committee', 'overseer']:
        return True
    
    if discussion.visibility == 'all_committees':
        return user.role in ['committee_member', 'central_committee', 'overseer']
    elif discussion.visibility == 'regional':
        return user.region == discussion.region
    elif discussion.visibility == 'divisional':
        return user.region == discussion.region and user.division == discussion.division
    elif discussion.visibility == 'central_only':
        return user.role in ['central_committee', 'overseer']
    
    return False


@discussions_bp.route('/', methods=['POST'])
@login_required
def create_discussion():
    """Create a new discussion"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title') or not data.get('content'):
        return jsonify({'error': 'Title and content are required'}), 400
    
    # Set visibility based on user role and request
    visibility = data.get('visibility', 'divisional')
    if current_user.role not in ['central_committee', 'overseer'] and visibility == 'central_only':
        visibility = 'divisional'
    
    discussion = Discussion(
        application_id=data.get('application_id'),
        title=data['title'],
        content=data['content'],
        category=data.get('category', 'general'),
        visibility=visibility,
        region=current_user.region if visibility in ['regional', 'divisional'] else None,
        division=current_user.division if visibility == 'divisional' else None,
        created_by_id=current_user.id,
        is_pinned=data.get('is_pinned', False) if current_user.role in ['central_committee', 'overseer'] else False
    )
    
    try:
        db.session.add(discussion)
        db.session.commit()
        
        return jsonify({
            'message': 'Discussion created successfully',
            'discussion': discussion.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create discussion', 'details': str(e)}), 500


@discussions_bp.route('/', methods=['GET'])
@login_required
def get_discussions():
    """Get discussions based on user permissions"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    category = request.args.get('category')
    
    query = Discussion.query
    
    # Filter based on visibility and user role
    if current_user.role == 'committee_member':
        # Committee members see:
        # - all_committees discussions
        # - regional discussions for their region
        # - divisional discussions for their division
        query = query.filter(
            db.or_(
                Discussion.visibility == 'all_committees',
                db.and_(
                    Discussion.visibility == 'regional',
                    Discussion.region == current_user.region
                ),
                db.and_(
                    Discussion.visibility == 'divisional',
                    Discussion.region == current_user.region,
                    Discussion.division == current_user.division
                )
            )
        )
    # Central committee and overseers see everything
    
    # Filter by category
    if category:
        query = query.filter_by(category=category)
    
    # Order by pinned first, then most recent
    query = query.order_by(Discussion.is_pinned.desc(), Discussion.created_at.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    discussions = [disc.to_dict() for disc in pagination.items]
    
    return jsonify({
        'discussions': discussions,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@discussions_bp.route('/<int:discussion_id>', methods=['GET'])
@login_required
def get_discussion(discussion_id):
    """Get a specific discussion with replies"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return jsonify({'error': 'Discussion not found'}), 404
    
    # Check permissions
    if not can_view_discussion(discussion, current_user):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get replies
    replies = [reply.to_dict() for reply in discussion.replies]
    
    result = discussion.to_dict()
    result['replies'] = replies
    
    return jsonify(result), 200


@discussions_bp.route('/<int:discussion_id>/replies', methods=['POST'])
@login_required
def add_reply(discussion_id):
    """Add a reply to a discussion"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return jsonify({'error': 'Discussion not found'}), 404
    
    # Check permissions
    if not can_view_discussion(discussion, current_user):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if discussion is closed
    if discussion.is_closed and current_user.role not in ['central_committee', 'overseer']:
        return jsonify({'error': 'Discussion is closed'}), 403
    
    data = request.get_json()
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    reply = DiscussionReply(
        discussion_id=discussion_id,
        content=data['content'],
        created_by_id=current_user.id
    )
    
    # Update discussion timestamp
    discussion.updated_at = datetime.utcnow()
    
    try:
        db.session.add(reply)
        db.session.commit()
        
        return jsonify({
            'message': 'Reply added successfully',
            'reply': reply.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add reply', 'details': str(e)}), 500


@discussions_bp.route('/<int:discussion_id>', methods=['PUT'])
@login_required
def update_discussion(discussion_id):
    """Update a discussion (pin, close, etc.)"""
    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return jsonify({'error': 'Discussion not found'}), 404
    
    # Only creator, central committee, or overseers can update
    if (discussion.created_by_id != current_user.id and 
        current_user.role not in ['central_committee', 'overseer']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Only central committee and overseers can pin/close
    if current_user.role in ['central_committee', 'overseer']:
        if 'is_pinned' in data:
            discussion.is_pinned = data['is_pinned']
        if 'is_closed' in data:
            discussion.is_closed = data['is_closed']
    
    # Creator can update title and content
    if discussion.created_by_id == current_user.id:
        if 'title' in data:
            discussion.title = data['title']
        if 'content' in data:
            discussion.content = data['content']
    
    discussion.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Discussion updated successfully',
            'discussion': discussion.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update discussion', 'details': str(e)}), 500


@discussions_bp.route('/<int:discussion_id>', methods=['DELETE'])
@login_required
def delete_discussion(discussion_id):
    """Delete a discussion"""
    discussion = Discussion.query.get(discussion_id)
    if not discussion:
        return jsonify({'error': 'Discussion not found'}), 404
    
    # Only creator, central committee, or overseers can delete
    if (discussion.created_by_id != current_user.id and 
        current_user.role not in ['central_committee', 'overseer']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        db.session.delete(discussion)
        db.session.commit()
        return jsonify({'message': 'Discussion deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete discussion', 'details': str(e)}), 500

