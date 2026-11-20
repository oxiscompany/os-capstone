"""
SQLAlchemy ORM Models representing all 14 database tables for LabNexus.
Includes proper foreign keys, constraints, and indexes.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="admin", nullable=False) # admin, technician, faculty, student
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions = relationship("ComputerSession", back_populates="user_record")


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    location = Column(String(100), nullable=True)
    capacity = Column(Integer, default=30)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active") # active, maintenance, reserved
    created_at = Column(DateTime, default=datetime.utcnow)

    computers = relationship("Computer", back_populates="laboratory")
    bookings = relationship("LabBooking", back_populates="laboratory")


class Computer(Base):
    __tablename__ = "computers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), unique=True, index=True, nullable=False) # e.g. PC-001
    name = Column(String(50), nullable=False)
    lab_id = Column(Integer, ForeignKey("laboratories.id"), nullable=True)
    
    # Hardware specs
    os_name = Column(String(50), default="Windows 11 Pro")
    os_version = Column(String(50), default="23H2")
    cpu_model = Column(String(100), default="Intel Core i7-13700")
    cpu_cores = Column(Integer, default=8)
    ram_capacity_gb = Column(Float, default=16.0)
    storage_capacity_gb = Column(Float, default=512.0)
    ip_address = Column(String(45), default="192.168.1.101")
    mac_address = Column(String(17), default="00:1A:2B:3C:4D:01")
    
    # State snapshot
    status = Column(String(20), default="online", index=True) # online, offline, warning, critical
    is_simulated = Column(Boolean, default=True)
    active_user = Column(String(50), nullable=True)
    uptime_seconds = Column(Integer, default=0)
    last_heartbeat = Column(DateTime, default=datetime.utcnow, index=True)
    health_score = Column(Float, default=100.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="computers")
    metrics = relationship("ComputerMetric", back_populates="computer", cascade="all, delete-orphan")
    processes = relationship("ComputerProcess", back_populates="computer", cascade="all, delete-orphan")
    sessions = relationship("ComputerSession", back_populates="computer", cascade="all, delete-orphan")
    hardware_components = relationship("HardwareInventory", back_populates="computer")
    alerts = relationship("Alert", back_populates="computer")
    health_history = relationship("ComputerHealthHistory", back_populates="computer")


class ComputerMetric(Base):
    __tablename__ = "computer_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), ForeignKey("computers.computer_id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    cpu_percent = Column(Float, nullable=False)
    ram_percent = Column(Float, nullable=False)
    disk_percent = Column(Float, nullable=False)
    disk_health = Column(Float, default=100.0) # 0 to 100%
    network_rx_kbps = Column(Float, default=0.0) # Download
    network_tx_kbps = Column(Float, default=0.0) # Upload
    health_score = Column(Float, default=100.0)
    status = Column(String(20), default="online")

    computer = relationship("Computer", back_populates="metrics")

    __table_args__ = (
        Index("idx_metric_comp_time", "computer_id", "timestamp"),
    )


class ComputerProcess(Base):
    __tablename__ = "computer_processes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), ForeignKey("computers.computer_id", ondelete="CASCADE"), index=True, nullable=False)
    pid = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    cpu_percent = Column(Float, default=0.0)
    memory_mb = Column(Float, default=0.0)
    status = Column(String(20), default="running") # running, sleeping, terminated
    is_simulated = Column(Boolean, default=True)
    started_at = Column(DateTime, default=datetime.utcnow)

    computer = relationship("Computer", back_populates="processes")


class ComputerSession(Base):
    __tablename__ = "computer_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), ForeignKey("computers.computer_id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(50), nullable=False)
    login_time = Column(DateTime, default=datetime.utcnow, index=True)
    logout_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    session_type = Column(String(30), default="Student Lab Work") # Student Lab Work, Faculty Lecture, Admin Maintenance
    status = Column(String(20), default="active") # active, closed

    computer = relationship("Computer", back_populates="sessions")
    user_record = relationship("User", back_populates="sessions")


class HardwareInventory(Base):
    __tablename__ = "hardware_inventory"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), ForeignKey("computers.computer_id"), index=True, nullable=True)
    component_type = Column(String(50), nullable=False) # CPU, RAM, SSD, HDD, Motherboard, PSU, GPU, NIC
    brand = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(20), default="operational") # operational, degraded, failed, replacement_needed
    purchase_date = Column(DateTime, default=datetime.utcnow)
    warranty_expiry = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    computer = relationship("Computer", back_populates="hardware_components")


class SoftwareInventory(Base):
    __tablename__ = "software_inventory"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), index=True, nullable=False)
    version = Column(String(30), nullable=False)
    publisher = Column(String(100), nullable=True)
    category = Column(String(50), default="Development") # IDE, Browser, Security, Simulation, Utility
    is_approved = Column(Boolean, default=True) # Approved vs Unauthorized
    min_ram_gb = Column(Float, default=2.0)
    notes = Column(Text, nullable=True)

    licenses = relationship("SoftwareLicense", back_populates="software")


class SoftwareLicense(Base):
    __tablename__ = "software_licenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    software_id = Column(Integer, ForeignKey("software_inventory.id"), nullable=False)
    license_key = Column(String(100), unique=True, nullable=False)
    license_type = Column(String(50), default="Perpetual") # Perpetual, Subscription, Educational, Site, Open Source
    total_seats = Column(Integer, default=30)
    used_seats = Column(Integer, default=10)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    cost = Column(Float, default=0.0)

    software = relationship("SoftwareInventory", back_populates="licenses")


class LabBooking(Base):
    __tablename__ = "lab_bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_id = Column(Integer, ForeignKey("laboratories.id"), nullable=False)
    faculty_name = Column(String(100), nullable=False)
    faculty_email = Column(String(100), nullable=True)
    department = Column(String(100), default="Computer Science")
    purpose = Column(String(255), nullable=False)
    booking_date = Column(String(10), index=True, nullable=False) # YYYY-MM-DD
    start_time = Column(String(5), nullable=False) # HH:MM
    end_time = Column(String(5), nullable=False) # HH:MM
    status = Column(String(20), default="confirmed") # confirmed, pending, cancelled, completed
    attendees_count = Column(Integer, default=25)
    created_at = Column(DateTime, default=datetime.utcnow)

    laboratory = relationship("Laboratory", back_populates="bookings")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), ForeignKey("computers.computer_id"), index=True, nullable=False)
    alert_type = Column(String(50), nullable=False) # CPU_WARNING, CPU_CRITICAL, RAM_WARNING, RAM_CRITICAL, DISK_WARNING, DISK_CRITICAL, OFFLINE, UNAUTHORIZED_APP, HARDWARE_FAULT
    severity = Column(String(20), index=True, nullable=False) # info, warning, critical
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    metric_name = Column(String(30), nullable=True)
    metric_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    
    is_acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(50), nullable=True)
    
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    computer = relationship("Computer", back_populates="alerts")


class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scenario_id = Column(String(50), index=True, nullable=False) # e.g. SCENARIO_CPU_OVERLOAD
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    target_computer_id = Column(String(20), nullable=False)
    trigger_conditions = Column(String(255), nullable=True)
    execution_status = Column(String(30), default="pending") # pending, running, completed, failed, recovered
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    generated_alerts_count = Column(Integer, default=0)
    recovery_status = Column(String(50), default="not_started") # not_started, in_progress, recovered
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    events = relationship("SimulationEvent", back_populates="scenario")


class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scenario_id = Column(Integer, ForeignKey("simulation_scenarios.id"), nullable=True)
    computer_id = Column(String(20), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # FAULT_INJECTED, METRIC_SPIKE, PROCESS_STARTED, NETWORK_DISCONNECTED, RECOVERY_INITIATED, RESOLVED
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    scenario = relationship("SimulationScenario", back_populates="events")


class ComputerHealthHistory(Base):
    __tablename__ = "computer_health_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    computer_id = Column(String(20), ForeignKey("computers.computer_id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    health_score = Column(Float, nullable=False) # 0 to 100
    cpu_score = Column(Float, nullable=False)
    ram_score = Column(Float, nullable=False)
    disk_score = Column(Float, nullable=False)
    network_score = Column(Float, nullable=False)
    failure_risk_score = Column(Float, default=0.0) # Predictive maintenance risk score 0 to 100
    status = Column(String(20), default="healthy") # healthy, warning, critical, offline

    computer = relationship("Computer", back_populates="health_history")

    __table_args__ = (
        Index("idx_health_comp_time", "computer_id", "timestamp"),
    )
