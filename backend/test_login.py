"""
Test script to verify login credentials work
"""
from app import create_app
from models import db, User

app = create_app()

with app.app_context():
    # Find admin user
    admin = User.query.filter_by(username='admin').first()
    
    if admin:
        print(f"✓ Found user: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Role: {admin.role}")
        print(f"  Active: {admin.is_active}")
        
        # Test password
        test_password = 'admin123'
        if admin.check_password(test_password):
            print(f"✓ Password '{test_password}' is CORRECT")
        else:
            print(f"✗ Password '{test_password}' is INCORRECT")
            
        # Also test wrong password
        if admin.check_password('wrongpassword'):
            print(f"✗ ERROR: Wrong password was accepted!")
        else:
            print(f"✓ Wrong password correctly rejected")
    else:
        print("✗ Admin user not found in database")

