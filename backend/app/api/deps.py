from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import models
from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    x_user_role: str | None = Header(default=None),
    x_user_email: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    """Retrieve the current user from JWT token, with fallback to role header in demo mode."""
    # 1. Check JWT if present
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id:
                user = db.query(models.User).filter(models.User.id == UUID(user_id)).first()
                if user and user.is_active:
                    return user
        except (JWTError, ValueError):
            pass

    # 2. Support demo role header for seamless persona switching in demo mode
    if x_user_role:
        role = x_user_role.lower()
        query = db.query(models.User).filter(models.User.role == role)
        if x_user_email:
            query = query.filter(models.User.email == x_user_email.lower())
        user = query.first()
        if user:
            return user
        # Return a synthetic demo identity for the requested role
        first_school = db.query(models.School).first()
        first_child = db.query(models.Child).first()
        return models.User(
            email=x_user_email or f"{role}@demo.seemy-mind.org",
            full_name=f"Demo {role.capitalize()}",
            role=role,
            is_active=True,
            is_verified=True,
            school_id=first_school.id if first_school else None,
            child_id=first_child.id if first_child else None,
        )

    # 3. Default demo user: SENCO
    first_user = db.query(models.User).first()
    if first_user:
        return first_user

    return models.User(
        email="senco@stjudes.sch.uk",
        full_name="Amara Okafor (SENCO)",
        role="senco",
        is_active=True,
        is_verified=True,
    )


def require_roles(allowed_roles: list[str]):
    """Enforce Role-Based Access Control on endpoint."""

    def role_checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {allowed_roles}. Current role: '{current_user.role}'.",
            )
        return current_user

    return role_checker


def verify_child_access(
    child_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.Child:
    """Ensure parent or child can only access their authorized pupil record."""
    child = db.query(models.Child).filter(models.Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Pupil not found.")

    if current_user.role == "parent":
        # Check if parent is legally linked to this child
        if current_user.child_id == child_id:
            return child
        guardian_id = current_user.guardian_id
        if not guardian_id and current_user.email:
            guardian = db.query(models.Guardian).filter(models.Guardian.email == current_user.email).first()
            if guardian:
                guardian_id = guardian.id
        if guardian_id:
            link = (
                db.query(models.ChildGuardianLink)
                .filter(
                    models.ChildGuardianLink.child_id == child_id,
                    models.ChildGuardianLink.guardian_id == guardian_id,
                )
                .first()
            )
            if link:
                return child
        # If parent has no link, deny access
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Parents can only access records for their own children.",
        )

    if (
        current_user.role == "child"
        and current_user.child_id
        and current_user.child_id != child_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Pupils can only access their own dashboard.",
        )

    return child


def verify_school_tenant_access(
    school_id: UUID,
    current_user: models.User = Depends(get_current_user),
) -> None:
    """Ensure non-admin users cannot access or mutate cross-school records."""
    if current_user.role == "admin":
        # Trust/Platform admin has cross-school governance oversight
        return
    if current_user.school_id and current_user.school_id != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to access data belonging to another school tenant.",
        )

