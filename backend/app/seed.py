"""
Database initialization and seed script for LabNexus.
Creates all 14 tables and seeds realistic capstone reference data.
"""
from datetime import datetime, timedelta
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.entities import (
    User, Laboratory, Computer, HardwareInventory,
    SoftwareInventory, SoftwareLicense, LabBooking,
    ComputerSession, ComputerMetric
)
from backend.app.simulation.engine import simulation_engine
from backend.app.auth_utils import get_password_hash

def init_and_seed_db():
    print("Creating all 14 database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # 1. Seed Admin User
        admin_check = db.query(User).filter(User.username == "admin").first()
        if not admin_check:
            admin_user = User(
                username="admin",
                email="admin@labnexus.edu",
                hashed_password=get_password_hash("admin123"),
                full_name="LabNexus Administrator",
                role="admin",
                is_active=True
            )
            faculty_user = User(
                username="prof.vikram",
                email="vikram@labnexus.edu",
                hashed_password=get_password_hash("faculty123"),
                full_name="Prof. Vikram Sharma",
                role="faculty",
                is_active=True
            )
            db.add_all([admin_user, faculty_user])
            db.commit()
            print("Seeded default users (admin, prof.vikram).")

        # 2. Seed Laboratory
        lab = db.query(Laboratory).filter(Laboratory.code == "LAB-101").first()
        if not lab:
            lab = Laboratory(
                name="Systems & Simulation Lab A",
                code="LAB-101",
                location="Turing Hall, 3rd Floor, Room 302",
                capacity=30,
                description="High-performance laboratory equipped with independent workstations for OS design, networking, and simulation experiments.",
                status="active"
            )
            db.add(lab)
            db.commit()
            db.refresh(lab)
            print("Seeded Laboratory LAB-101.")

        # 3. Seed Computers (10 Virtual Computers)
        existing_comps = db.query(Computer).all()
        if not existing_comps:
            for pc_id, pc in simulation_engine.computers.items():
                comp_record = Computer(
                    computer_id=pc.computer_id,
                    name=pc.name,
                    lab_id=lab.id,
                    os_name=pc.os_name,
                    os_version=pc.os_version,
                    cpu_model=pc.cpu_model,
                    cpu_cores=pc.cpu_cores,
                    ram_capacity_gb=pc.ram_capacity_gb,
                    storage_capacity_gb=pc.storage_capacity_gb,
                    ip_address=pc.ip_address,
                    mac_address=pc.mac_address,
                    status=pc.status,
                    is_simulated=True,
                    active_user=pc.active_user,
                    uptime_seconds=pc.uptime_seconds,
                    last_heartbeat=pc.last_heartbeat,
                    health_score=pc.health_score
                )
                db.add(comp_record)

                # Seed Hardware Inventory for each computer
                hw_cpu = HardwareInventory(
                    computer_id=pc.computer_id,
                    component_type="CPU",
                    brand="Intel" if "Intel" in pc.cpu_model else "AMD",
                    model=pc.cpu_model,
                    serial_number=f"SN-CPU-{pc.computer_id}-8932",
                    status="operational",
                    purchase_date=datetime.utcnow() - timedelta(days=240),
                    warranty_expiry=datetime.utcnow() + timedelta(days=850),
                    notes="Primary compute unit with active thermal monitoring"
                )
                hw_ram = HardwareInventory(
                    computer_id=pc.computer_id,
                    component_type="RAM",
                    brand="Corsair Vengeance",
                    model=f"{int(pc.ram_capacity_gb)}GB DDR5-5600MHz",
                    serial_number=f"SN-RAM-{pc.computer_id}-4412",
                    status="operational",
                    purchase_date=datetime.utcnow() - timedelta(days=240),
                    warranty_expiry=datetime.utcnow() + timedelta(days=850)
                )
                hw_ssd = HardwareInventory(
                    computer_id=pc.computer_id,
                    component_type="Storage",
                    brand="Samsung",
                    model=f"{int(pc.storage_capacity_gb)}GB NVMe 980 Pro PCIe 4.0",
                    serial_number=f"SN-SSD-{pc.computer_id}-9100",
                    status="operational",
                    purchase_date=datetime.utcnow() - timedelta(days=240),
                    warranty_expiry=datetime.utcnow() + timedelta(days=850)
                )
                db.add_all([hw_cpu, hw_ram, hw_ssd])

            db.commit()
            print("Seeded 10 Virtual Computers and Hardware Inventory.")

        # 4. Seed Software Inventory & Licenses
        if not db.query(SoftwareInventory).first():
            sw_items = [
                SoftwareInventory(name="Visual Studio Code", version="1.87.2", publisher="Microsoft", category="IDE", is_approved=True, min_ram_gb=4.0),
                SoftwareInventory(name="Python Development Toolchain", version="3.11.9", publisher="PSF", category="Development", is_approved=True, min_ram_gb=2.0),
                SoftwareInventory(name="Google Chrome Enterprise", version="123.0", publisher="Google", category="Browser", is_approved=True, min_ram_gb=4.0),
                SoftwareInventory(name="Wireshark Packet Analyzer", version="4.2.3", publisher="Wireshark Foundation", category="Networking", is_approved=True, min_ram_gb=4.0),
                SoftwareInventory(name="MATLAB Academic Suite", version="R2023b", publisher="MathWorks", category="Simulation", is_approved=True, min_ram_gb=8.0),
                SoftwareInventory(name="Docker Desktop", version="4.28", publisher="Docker Inc", category="Containerization", is_approved=True, min_ram_gb=8.0),
                SoftwareInventory(name="CryptoMiner_XMRig", version="6.21", publisher="Unknown", category="Utility", is_approved=False, min_ram_gb=1.0, notes="UNAUTHORIZED: Cryptocurrency mining payload violation"),
            ]
            db.add_all(sw_items)
            db.commit()

            # Seed Licenses
            lic_matlab = SoftwareLicense(
                software_id=5,
                license_key="MATH-ACAD-2026-98124-CAMPUS",
                license_type="Educational Site License",
                total_seats=50,
                used_seats=28,
                expiry_date=datetime.utcnow() + timedelta(days=365),
                cost=4500.0
            )
            lic_docker = SoftwareLicense(
                software_id=6,
                license_key="DCKR-EDU-PRO-87123",
                license_type="Educational Subscription",
                total_seats=30,
                used_seats=15,
                expiry_date=datetime.utcnow() + timedelta(days=180),
                cost=1200.0
            )
            db.add_all([lic_matlab, lic_docker])
            db.commit()
            print("Seeded Software Inventory and Software Licenses.")

        # 5. Seed Lab Bookings
        if not db.query(LabBooking).first():
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            tomorrow_str = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            b1 = LabBooking(
                lab_id=lab.id,
                faculty_name="Prof. Vikram Sharma",
                faculty_email="vikram@labnexus.edu",
                department="Computer Science",
                purpose="CS-401 Advanced Operating Systems Lab",
                booking_date=today_str,
                start_time="09:00",
                end_time="11:00",
                status="confirmed",
                attendees_count=24
            )
            b2 = LabBooking(
                lab_id=lab.id,
                faculty_name="Dr. Priya Sengupta",
                faculty_email="priya@labnexus.edu",
                department="Information Technology",
                purpose="IT-302 Computer Networks & Sockets Practicum",
                booking_date=today_str,
                start_time="14:00",
                end_time="16:00",
                status="confirmed",
                attendees_count=28
            )
            b3 = LabBooking(
                lab_id=lab.id,
                faculty_name="Prof. Rohan Gupta",
                faculty_email="rohan@labnexus.edu",
                department="Artificial Intelligence",
                purpose="AI-505 Distributed Model Training Workshop",
                booking_date=tomorrow_str,
                start_time="10:00",
                end_time="13:00",
                status="confirmed",
                attendees_count=30
            )
            db.add_all([b1, b2, b3])
            db.commit()
            print("Seeded initial Lab Bookings.")

        # 6. Seed initial metrics history for graphs
        if not db.query(ComputerMetric).first():
            now = datetime.utcnow()
            for pc_id, pc in simulation_engine.computers.items():
                for i in range(12, 0, -1):
                    past_time = now - timedelta(seconds=i * 5)
                    m = ComputerMetric(
                        computer_id=pc.computer_id,
                        timestamp=past_time,
                        cpu_percent=round(max(5.0, min(95.0, pc.cpu_percent + (i % 5 - 2) * 2.5)), 1),
                        ram_percent=round(max(15.0, min(90.0, pc.ram_percent + (i % 3 - 1) * 1.5)), 1),
                        disk_percent=pc.disk_percent,
                        disk_health=pc.disk_health,
                        network_rx_kbps=round(max(10.0, pc.network_rx_kbps + (i * 12)), 1),
                        network_tx_kbps=round(max(5.0, pc.network_tx_kbps + (i * 6)), 1),
                        health_score=pc.health_score,
                        status="online"
                    )
                    db.add(m)
            db.commit()
            print("Seeded historical telemetry metrics for initial graphs.")

    finally:
        db.close()

if __name__ == "__main__":
    init_and_seed_db()
