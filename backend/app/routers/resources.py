"""
Lab Resource Management Router for LabNexus.
Hardware Inventory, Software & Licenses, Lab Bookings with Conflict Detection, and Session Tracking.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.database import get_db
from backend.app.models.entities import (
    HardwareInventory, SoftwareInventory, SoftwareLicense,
    LabBooking, ComputerSession, Computer
)
from backend.app.schemas.schemas import (
    HardwareItemOut, HardwareItemCreate,
    SoftwareItemOut, SoftwareItemCreate,
    LicenseOut, LicenseCreate,
    LabBookingOut, LabBookingCreate,
    SessionOut, SessionLoginRequest
)

router = APIRouter(prefix="/resources", tags=["Resource Management"])

# ==================== HARDWARE INVENTORY ====================

@router.get("/hardware", response_model=List[HardwareItemOut])
def list_hardware(computer_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(HardwareInventory)
    if computer_id:
        query = query.filter(HardwareInventory.computer_id == computer_id)
    return query.order_by(HardwareInventory.id.asc()).all()

@router.post("/hardware", response_model=HardwareItemOut, status_code=status.HTTP_201_CREATED)
def create_hardware(item: HardwareItemCreate, db: Session = Depends(get_db)):
    hw = HardwareInventory(
        computer_id=item.computer_id,
        component_type=item.component_type,
        brand=item.brand,
        model=item.model,
        serial_number=item.serial_number,
        status=item.status,
        warranty_expiry=item.warranty_expiry,
        notes=item.notes
    )
    db.add(hw)
    db.commit()
    db.refresh(hw)
    return hw

# ==================== SOFTWARE & LICENSES ====================

@router.get("/software", response_model=List[SoftwareItemOut])
def list_software(db: Session = Depends(get_db)):
    return db.query(SoftwareInventory).order_by(SoftwareInventory.id.asc()).all()

@router.post("/software", response_model=SoftwareItemOut, status_code=status.HTTP_201_CREATED)
def create_software(sw: SoftwareItemCreate, db: Session = Depends(get_db)):
    record = SoftwareInventory(
        name=sw.name,
        version=sw.version,
        publisher=sw.publisher,
        category=sw.category,
        is_approved=sw.is_approved,
        min_ram_gb=sw.min_ram_gb,
        notes=sw.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/licenses", response_model=List[LicenseOut])
def list_licenses(db: Session = Depends(get_db)):
    return db.query(SoftwareLicense).all()

@router.post("/licenses", response_model=LicenseOut, status_code=status.HTTP_201_CREATED)
def create_license(lic: LicenseCreate, db: Session = Depends(get_db)):
    record = SoftwareLicense(
        software_id=lic.software_id,
        license_key=lic.license_key,
        license_type=lic.license_type,
        total_seats=lic.total_seats,
        used_seats=lic.used_seats,
        expiry_date=lic.expiry_date,
        cost=lic.cost
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# ==================== LAB BOOKINGS WITH CONFLICT DETECTION ====================

@router.get("/bookings", response_model=List[LabBookingOut])
def list_bookings(date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(LabBooking)
    if date:
        query = query.filter(LabBooking.booking_date == date)
    return query.order_by(LabBooking.booking_date.asc(), LabBooking.start_time.asc()).all()

@router.post("/bookings", response_model=LabBookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(booking: LabBookingCreate, db: Session = Depends(get_db)):
    """
    Creates a new lab reservation with automated time-slot conflict detection.
    Overlapping reservations on the same date and lab are rejected with an explicit conflict message.
    """
    if booking.start_time >= booking.end_time:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid time slot: Start time ({booking.start_time}) must precede End time ({booking.end_time})."
        )

    # Check for overlapping confirmed bookings on the same lab and date
    existing_bookings = db.query(LabBooking).filter(
        LabBooking.lab_id == booking.lab_id,
        LabBooking.booking_date == booking.booking_date,
        LabBooking.status == "confirmed"
    ).all()

    for eb in existing_bookings:
        # Overlap occurs unless one ends before the other starts
        if not (booking.end_time <= eb.start_time or booking.start_time >= eb.end_time):
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Booking Conflict Detected: Lab is already reserved from {eb.start_time} to {eb.end_time} "
                    f"by '{eb.faculty_name}' for '{eb.purpose}'."
                )
            )

    new_booking = LabBooking(
        lab_id=booking.lab_id,
        faculty_name=booking.faculty_name,
        faculty_email=booking.faculty_email,
        department=booking.department,
        purpose=booking.purpose,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status="confirmed",
        attendees_count=booking.attendees_count
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@router.put("/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    b = db.query(LabBooking).filter(LabBooking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail=f"Booking #{booking_id} not found.")
    b.status = "cancelled"
    db.commit()
    return {"status": "cancelled", "booking_id": booking_id}

# ==================== SESSION MANAGEMENT ====================

@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(computer_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ComputerSession)
    if computer_id:
        query = query.filter(ComputerSession.computer_id == computer_id)
    return query.order_by(ComputerSession.id.desc()).limit(50).all()
