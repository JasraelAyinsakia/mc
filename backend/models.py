from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20))
    
    # Role: 'single', 'committee_member', 'central_committee', 'overseer'
    role = db.Column(db.String(30), nullable=False, default='single')
    
    # Location information
    region = db.Column(db.String(100))  # e.g., Greater Accra, Ashanti
    division = db.Column(db.String(100))  # e.g., Accra Central, Kumasi East
    local_church = db.Column(db.String(150))
    
    # Gender
    gender = db.Column(db.String(10))  # 'male' or 'female'
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='applicant', lazy=True, foreign_keys='Application.applicant_id')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'full_name': self.full_name,
            'phone': self.phone,
            'role': self.role,
            'region': self.region,
            'division': self.division,
            'local_church': self.local_church,
            'gender': self.gender,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    """Marriage application model"""
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    application_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Applicant (Brother or Sister who initiated)
    applicant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    applicant_type = db.Column(db.String(10), nullable=False)  # 'brother' or 'sister'
    
    # Partner information
    partner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    partner_name = db.Column(db.String(150))
    partner_location = db.Column(db.String(200))
    partner_region = db.Column(db.String(100))
    partner_division = db.Column(db.String(100))
    partner_informed = db.Column(db.Boolean, default=False)
    
    # Application details
    age = db.Column(db.Integer)
    occupation = db.Column(db.String(150))
    church_role = db.Column(db.String(200))  # What they do in church
    
    # Salvation details
    is_born_again = db.Column(db.Boolean)
    salvation_date = db.Column(db.Date)
    salvation_experience = db.Column(db.Text)
    
    # Marriage history
    previously_married = db.Column(db.Boolean, default=False)
    number_of_children = db.Column(db.Integer, default=0)
    previous_marriage_details = db.Column(db.Text)
    
    # Partner knowledge
    knows_partner = db.Column(db.Boolean)
    relationship_description = db.Column(db.Text)
    
    # Current stage
    current_stage = db.Column(db.String(100), nullable=False, default='application_submitted')
    status = db.Column(db.String(30), nullable=False, default='pending')  # pending, approved, rejected, on_hold
    
    # Committee assignment
    assigned_committee_member_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    assigned_committee_member = db.relationship('User', foreign_keys=[assigned_committee_member_id])
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    approved_at = db.Column(db.DateTime)
    
    # Notes
    admin_notes = db.Column(db.Text)
    
    # Relationships
    stage_history = db.relationship('StageHistory', backref='application', lazy=True, cascade='all, delete-orphan')
    medical_tests = db.relationship('MedicalTest', backref='application', lazy=True, cascade='all, delete-orphan')
    courtship_progress_records = db.relationship('CourtshipProgress', back_populates='application', lazy='dynamic', cascade='all, delete-orphan')
    check_ins = db.relationship('CheckIn', backref='application', lazy=True, cascade='all, delete-orphan')
    meetings = db.relationship('Meeting', backref='application', lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='application', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'application_number': self.application_number,
            'applicant': self.applicant.to_dict() if self.applicant else None,
            'applicant_type': self.applicant_type,
            'partner_name': self.partner_name,
            'partner_location': self.partner_location,
            'partner_region': self.partner_region,
            'partner_division': self.partner_division,
            'partner_informed': self.partner_informed,
            'age': self.age,
            'occupation': self.occupation,
            'church_role': self.church_role,
            'is_born_again': self.is_born_again,
            'salvation_date': self.salvation_date.isoformat() if self.salvation_date else None,
            'salvation_experience': self.salvation_experience,
            'previously_married': self.previously_married,
            'number_of_children': self.number_of_children,
            'knows_partner': self.knows_partner,
            'current_stage': self.current_stage,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class StageHistory(db.Model):
    """Track progress through application stages"""
    __tablename__ = 'stage_history'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    
    stage_name = db.Column(db.String(100), nullable=False)
    stage_order = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False)  # pending, in_progress, completed, rejected
    
    # Who performed the action
    actioned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    actioned_by = db.relationship('User', foreign_keys=[actioned_by_id])
    
    notes = db.Column(db.Text)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'stage_name': self.stage_name,
            'stage_order': self.stage_order,
            'status': self.status,
            'notes': self.notes,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'actioned_by': self.actioned_by.to_dict() if self.actioned_by else None
        }


class MedicalTest(db.Model):
    """Medical test results tracking"""
    __tablename__ = 'medical_tests'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    
    person_type = db.Column(db.String(10), nullable=False)  # 'brother' or 'sister'
    
    # Test types
    hiv_test = db.Column(db.String(30))  # 'positive', 'negative', 'pending'
    hepatitis_test = db.Column(db.String(30))
    sickle_cell_test = db.Column(db.String(50))  # AA, AS, SS, etc.
    
    # Test details
    test_date = db.Column(db.Date)
    hospital_name = db.Column(db.String(200))
    hospital_location = db.Column(db.String(200))
    
    # Results
    results_received = db.Column(db.Boolean, default=False)
    results_received_at = db.Column(db.DateTime)
    compatibility_status = db.Column(db.String(30))  # 'compatible', 'incompatible', 'pending'
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'person_type': self.person_type,
            'hiv_test': self.hiv_test,
            'hepatitis_test': self.hepatitis_test,
            'sickle_cell_test': self.sickle_cell_test,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'hospital_name': self.hospital_name,
            'results_received': self.results_received,
            'compatibility_status': self.compatibility_status,
            'notes': self.notes
        }



class Meeting(db.Model):
    """Meetings scheduled for applications"""
    __tablename__ = 'meetings'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    scheduled_date = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    location = db.Column(db.String(200))
    
    meeting_type = db.Column(db.String(50), nullable=False)  # interview, review, introduction, check_in, final_approval
    meeting_format = db.Column(db.String(30), default='in_person')  # in_person, phone, video
    
    status = db.Column(db.String(30), default='scheduled')  # scheduled, completed, cancelled, rescheduled
    
    # Attendees
    attendees = db.Column(db.Text)  # JSON string of attendee names/roles
    
    # Meeting outcome
    notes = db.Column(db.Text)
    outcome = db.Column(db.String(50))  # approved, pending, rejected, needs_follow_up
    
    # Organized by
    organized_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    organized_by = db.relationship('User', foreign_keys=[organized_by_id])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'title': self.title,
            'description': self.description,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'duration_minutes': self.duration_minutes,
            'location': self.location,
            'meeting_type': self.meeting_type,
            'meeting_format': self.meeting_format,
            'status': self.status,
            'attendees': self.attendees,
            'notes': self.notes,
            'outcome': self.outcome,
            'organized_by': self.organized_by.to_dict() if self.organized_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CheckIn(db.Model):
    """Monthly check-ins during courtship"""
    __tablename__ = 'check_ins'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    
    scheduled_date = db.Column(db.DateTime, nullable=False)
    completed_date = db.Column(db.DateTime)
    
    status = db.Column(db.String(30), default='scheduled')  # scheduled, completed, cancelled
    
    # Meeting details
    meeting_type = db.Column(db.String(50))  # in_person, phone, video
    attendees = db.Column(db.Text)  # JSON string of attendee IDs
    
    # Notes from the check-in
    couple_feedback = db.Column(db.Text)
    counselor_notes = db.Column(db.Text)
    issues_raised = db.Column(db.Text)
    action_items = db.Column(db.Text)
    
    # Conducted by
    conducted_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    conducted_by = db.relationship('User', foreign_keys=[conducted_by_id])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'status': self.status,
            'meeting_type': self.meeting_type,
            'couple_feedback': self.couple_feedback,
            'counselor_notes': self.counselor_notes,
            'issues_raised': self.issues_raised,
            'action_items': self.action_items
        }


class Document(db.Model):
    """Document storage for applications"""
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    
    document_type = db.Column(db.String(50), nullable=False)  # medical_result, id_card, etc.
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    uploaded_by = db.relationship('User', foreign_keys=[uploaded_by_id])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_type': self.document_type,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'uploaded_by': self.uploaded_by.to_dict() if self.uploaded_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Discussion(db.Model):
    """Discussion board for committee communications"""
    __tablename__ = 'discussions'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=True)
    
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))  # general, application_specific, policy, announcement
    
    # Visibility and access control
    visibility = db.Column(db.String(50), default='all_committees')  # all_committees, regional, divisional, central_only
    region = db.Column(db.String(100))  # For regional-specific discussions
    division = db.Column(db.String(100))  # For division-specific discussions
    
    # Created by
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    # Status
    is_pinned = db.Column(db.Boolean, default=False)
    is_closed = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    replies = db.relationship('DiscussionReply', backref='discussion', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'visibility': self.visibility,
            'region': self.region,
            'division': self.division,
            'created_by': self.created_by.to_dict() if self.created_by else None,
            'is_pinned': self.is_pinned,
            'is_closed': self.is_closed,
            'reply_count': len(self.replies) if self.replies else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class DiscussionReply(db.Model):
    """Replies to discussions"""
    __tablename__ = 'discussion_replies'
    
    id = db.Column(db.Integer, primary_key=True)
    discussion_id = db.Column(db.Integer, db.ForeignKey('discussions.id'), nullable=False)
    
    content = db.Column(db.Text, nullable=False)
    
    # Created by
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'discussion_id': self.discussion_id,
            'content': self.content,
            'created_by': self.created_by.to_dict() if self.created_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Complaint(db.Model):
    """Anonymous complaints and feedback"""
    __tablename__ = 'complaints'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=True)
    
    complaint_type = db.Column(db.String(50), nullable=False)  # delay, bias, process_issue, other
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Routing - who should see this
    send_to = db.Column(db.String(50), nullable=False)  # central_committee, regional_pastor, national_overseer
    
    # Anonymous by default, but we track for accountability
    submitted_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    submitted_by = db.relationship('User', foreign_keys=[submitted_by_id])
    
    # Status tracking
    status = db.Column(db.String(30), default='pending')  # pending, reviewed, investigating, resolved, dismissed
    resolution_notes = db.Column(db.Text)
    resolved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_by = db.relationship('User', foreign_keys=[resolved_by_id])
    resolved_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, show_submitter=False):
        result = {
            'id': self.id,
            'application_id': self.application_id,
            'complaint_type': self.complaint_type,
            'severity': self.severity,
            'subject': self.subject,
            'description': self.description,
            'send_to': self.send_to,
            'status': self.status,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        
        # Only show submitter to authorized personnel
        if show_submitter:
            result['submitted_by'] = self.submitted_by.to_dict() if self.submitted_by else None
            result['resolved_by'] = self.resolved_by.to_dict() if self.resolved_by else None
        
        return result


class Notification(db.Model):
    """Notification system"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'))
    
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50))  # stage_update, check_in, approval, etc.
    
    read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CourtshipProgress(db.Model):
    """Track courtship topic progression for couples"""
    __tablename__ = 'courtship_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    week_number = db.Column(db.Integer, nullable=False)  # 1-25
    
    # Status: 'not_started', 'in_progress', 'completed'
    status = db.Column(db.String(20), default='not_started')
    
    # Shared notes between partners
    notes = db.Column(db.Text)
    
    # Track who added/updated notes
    last_updated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Date tracking
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - using back_populates to avoid conflicts
    application = db.relationship('Application', back_populates='courtship_progress_records')
    updated_by_user = db.relationship('User', foreign_keys=[last_updated_by], backref='courtship_updates')
    
    def to_dict(self, include_application=False):
        data = {
            'id': self.id,
            'application_id': self.application_id,
            'week_number': self.week_number,
            'status': self.status,
            'notes': self.notes,
            'last_updated_by': self.last_updated_by,
            'last_updated_by_name': self.updated_by_user.full_name if self.updated_by_user else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_application and self.application:
            data['application'] = {
                'id': self.application.id,
                'applicant_name': self.application.applicant_name,
                'partner_name': self.application.partner_name,
                'stage': self.application.stage
            }
        
        return data

