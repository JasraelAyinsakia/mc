from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Application, MedicalTest, StageHistory, Notification
from datetime import datetime

medical_bp = Blueprint('medical', __name__)

@medical_bp.route('/applications/<int:application_id>/tests', methods=['POST'])
@login_required
def create_medical_test(application_id):
    """Create medical test record"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Only committee members can create test records
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    required_fields = ['person_type', 'hospital_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create medical test record
    medical_test = MedicalTest(
        application_id=application_id,
        person_type=data['person_type'],
        hospital_name=data['hospital_name'],
        hospital_location=data.get('hospital_location', ''),
        test_date=datetime.fromisoformat(data['test_date']) if data.get('test_date') else datetime.utcnow(),
        notes=data.get('notes', '')
    )
    
    try:
        db.session.add(medical_test)
        
        # Notify applicant
        notification = Notification(
            user_id=application.applicant_id,
            application_id=application_id,
            title='Medical Test Requested',
            message=f'Please proceed with medical tests at {data["hospital_name"]}',
            notification_type='medical_test'
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Medical test record created',
            'test': medical_test.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Creation failed', 'details': str(e)}), 500


@medical_bp.route('/applications/<int:application_id>/tests', methods=['GET'])
@login_required
def get_medical_tests(application_id):
    """Get medical tests for an application"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    tests = MedicalTest.query.filter_by(application_id=application_id).all()
    
    return jsonify({
        'tests': [test.to_dict() for test in tests]
    }), 200


@medical_bp.route('/tests/<int:test_id>', methods=['PUT'])
@login_required
def update_medical_test(test_id):
    """Update medical test results (Hospital/Committee only)"""
    if current_user.role not in ['committee_member', 'central_committee', 'overseer']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    test = MedicalTest.query.get(test_id)
    
    if not test:
        return jsonify({'error': 'Test not found'}), 404
    
    data = request.get_json()
    
    # Update test results
    if 'hiv_test' in data:
        test.hiv_test = data['hiv_test']
    if 'hepatitis_test' in data:
        test.hepatitis_test = data['hepatitis_test']
    if 'sickle_cell_test' in data:
        test.sickle_cell_test = data['sickle_cell_test']
    if 'results_received' in data:
        test.results_received = data['results_received']
        if data['results_received']:
            test.results_received_at = datetime.utcnow()
    if 'notes' in data:
        test.notes = data['notes']
    
    test.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        
        # If all results are received, check compatibility
        if test.results_received:
            check_medical_compatibility(test.application_id)
        
        return jsonify({
            'message': 'Test results updated',
            'test': test.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'details': str(e)}), 500


def check_medical_compatibility(application_id):
    """Check medical compatibility between brother and sister"""
    application = Application.query.get(application_id)
    
    # Get both tests
    brother_test = MedicalTest.query.filter_by(
        application_id=application_id,
        person_type='brother',
        results_received=True
    ).first()
    
    sister_test = MedicalTest.query.filter_by(
        application_id=application_id,
        person_type='sister',
        results_received=True
    ).first()
    
    if not brother_test or not sister_test:
        return  # Wait for both results
    
    # Check compatibility
    is_compatible = True
    incompatibility_reason = []
    
    # HIV check - both must be negative
    if brother_test.hiv_test == 'positive' or sister_test.hiv_test == 'positive':
        is_compatible = False
        incompatibility_reason.append('HIV test positive')
    
    # Sickle cell compatibility check
    brother_genotype = brother_test.sickle_cell_test
    sister_genotype = sister_test.sickle_cell_test
    
    # Incompatible combinations
    incompatible_combinations = [
        ('AS', 'AS'),  # Both carriers
        ('AS', 'SS'),  # Carrier and full sickle cell
        ('SS', 'AS'),  # Full sickle cell and carrier
        ('SS', 'SS'),  # Both have sickle cell
    ]
    
    if (brother_genotype, sister_genotype) in incompatible_combinations:
        is_compatible = False
        incompatibility_reason.append(f'Sickle cell incompatibility ({brother_genotype} + {sister_genotype})')
    
    # Update test compatibility status
    compatibility_status = 'compatible' if is_compatible else 'incompatible'
    brother_test.compatibility_status = compatibility_status
    sister_test.compatibility_status = compatibility_status
    
    if not is_compatible:
        # Update application status
        application.status = 'rejected'
        application.admin_notes = f"Medical incompatibility: {', '.join(incompatibility_reason)}"
        
        # Create stage history
        stage = StageHistory(
            application_id=application_id,
            stage_name='Medical Compatibility Check',
            stage_order=10,
            status='completed',
            notes=f"Incompatible: {', '.join(incompatibility_reason)}",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            actioned_by_id=current_user.id
        )
        db.session.add(stage)
        
        # Notify applicant
        notification = Notification(
            user_id=application.applicant_id,
            application_id=application_id,
            title='Medical Results',
            message='Unfortunately, there are medical compatibility concerns. Please contact the committee.',
            notification_type='medical_result'
        )
        db.session.add(notification)
    else:
        # Compatible - move to next stage
        application.current_stage = 'first_meeting_scheduled'
        
        # Create stage history
        stage = StageHistory(
            application_id=application_id,
            stage_name='Medical Compatibility - Approved',
            stage_order=10,
            status='completed',
            notes='Medical tests show compatibility',
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            actioned_by_id=current_user.id
        )
        db.session.add(stage)
        
        # Notify applicant
        notification = Notification(
            user_id=application.applicant_id,
            application_id=application_id,
            title='Medical Results',
            message='Great news! Medical tests show compatibility. Next step: First meeting.',
            notification_type='medical_result'
        )
        db.session.add(notification)
    
    db.session.commit()


@medical_bp.route('/applications/<int:application_id>/compatibility', methods=['GET'])
@login_required
def get_compatibility_status(application_id):
    """Get medical compatibility status"""
    application = Application.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    # Check permissions
    if current_user.role == 'single' and application.applicant_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    tests = MedicalTest.query.filter_by(application_id=application_id).all()
    
    brother_test = next((t for t in tests if t.person_type == 'brother'), None)
    sister_test = next((t for t in tests if t.person_type == 'sister'), None)
    
    return jsonify({
        'brother_test_completed': brother_test.results_received if brother_test else False,
        'sister_test_completed': sister_test.results_received if sister_test else False,
        'compatibility_status': brother_test.compatibility_status if brother_test else 'pending',
        'both_tests_received': (brother_test and brother_test.results_received) and (sister_test and sister_test.results_received)
    }), 200

