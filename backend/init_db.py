"""
Database initialization script
Creates tables and seeds initial data including admin user
"""
from app import create_app
from models import db, User
from datetime import datetime

def init_database():
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Tables created successfully")
        
        # Check if admin user already exists
        admin = User.query.filter_by(username='admin').first()
        
        if not admin:
            print("\nCreating default admin user...")
            admin = User(
                email='admin@dlbc.org',
                username='admin',
                full_name='System Administrator',
                phone='+233000000000',
                role='central_committee',
                region='National',
                division='Headquarters',
                local_church='Headquarters',
                gender='male',
                is_active=True
            )
            admin.set_password('admin123')
            
            db.session.add(admin)
            
            # Create sample committee member
            committee = User(
                email='committee@dlbc.org',
                username='committee',
                full_name='Committee Member',
                phone='+233111111111',
                role='committee_member',
                region='Greater Accra',
                division='Accra Central',
                local_church='Accra Assembly 1',
                gender='male',
                is_active=True
            )
            committee.set_password('committee123')
            
            db.session.add(committee)
            
            # Create sample overseer
            overseer = User(
                email='overseer@dlbc.org',
                username='overseer',
                full_name='Regional Overseer',
                phone='+233222222222',
                role='overseer',
                region='Greater Accra',
                division='Accra Central',
                local_church='Regional Office',
                gender='male',
                is_active=True
            )
            overseer.set_password('overseer123')
            
            db.session.add(overseer)
            
            db.session.commit()
            
            print("✓ Default users created:")
            print("\n--- Admin Account ---")
            print("Username: admin")
            print("Password: admin123")
            print("Role: Central Committee")
            print("\n--- Committee Member Account ---")
            print("Username: committee")
            print("Password: committee123")
            print("Role: Committee Member")
            print("\n--- Overseer Account ---")
            print("Username: overseer")
            print("Password: overseer123")
            print("Role: Regional Overseer")
            print("\n⚠️  IMPORTANT: Change these passwords after first login!")
        else:
            print("\n✓ Admin user already exists")
        
        print("\n" + "="*50)
        print("Database initialized successfully!")
        print("="*50)
        print("\nYou can now start the application:")
        print("python app.py")

if __name__ == '__main__':
    init_database()

