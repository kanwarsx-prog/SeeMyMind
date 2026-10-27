"""Add operational fields introduced after the initial schema.

The original migration predates the live classroom, arrival, and NOYA audit
features.  These changes are intentionally idempotent because Render may be
upgrading an already-populated demo database.
"""

from collections.abc import Sequence

from alembic import op


revision: str = "002_operational_schema_updates"
down_revision: str | None = "001_initial_core"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Fields used by the live classroom and authentication experiences.
    op.execute("ALTER TABLE schools ADD COLUMN IF NOT EXISTS urn_number VARCHAR(20)")
    op.execute("ALTER TABLE schools ADD COLUMN IF NOT EXISTS phase VARCHAR(50) DEFAULT 'Primary'")
    op.execute("ALTER TABLE schools ADD COLUMN IF NOT EXISTS local_authority VARCHAR(100)")
    op.execute("ALTER TABLE schools ADD COLUMN IF NOT EXISTS lead_senco_name VARCHAR(140)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'system'")
    op.execute("ALTER TABLE children ADD COLUMN IF NOT EXISTS room_name VARCHAR(50)")
    op.execute("ALTER TABLE children ADD COLUMN IF NOT EXISTS buddy_name VARCHAR(140)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_children_room_name ON children (room_name)")
    op.execute("ALTER TABLE child_support_profiles ADD COLUMN IF NOT EXISTS annual_review_due DATE")

    # Fields used to retain the prompt, response, and child scope for NOYA runs.
    op.execute("ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS child_id UUID")
    op.execute("ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS input_prompt TEXT")
    op.execute("ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS output_text TEXT")
    op.execute("ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS execution_steps JSON")

    # One authoritative arrival record per pupil and school day.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS child_arrivals (
            id UUID PRIMARY KEY,
            child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
            school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
            arrival_date DATE NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'unknown',
            arrived_at TIMESTAMP WITH TIME ZONE,
            recorded_by UUID,
            recorded_by_name VARCHAR(140),
            recorded_by_role VARCHAR(50),
            recording_method VARCHAR(50) NOT NULL DEFAULT 'staff',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            CONSTRAINT uq_child_arrival_day UNIQUE (child_id, arrival_date)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_child_arrivals_child_id ON child_arrivals (child_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_child_arrivals_school_id ON child_arrivals (school_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_child_arrivals_arrival_date ON child_arrivals (arrival_date)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS child_arrivals")
    op.execute("ALTER TABLE ai_runs DROP COLUMN IF EXISTS execution_steps")
    op.execute("ALTER TABLE ai_runs DROP COLUMN IF EXISTS output_text")
    op.execute("ALTER TABLE ai_runs DROP COLUMN IF EXISTS input_prompt")
    op.execute("ALTER TABLE ai_runs DROP COLUMN IF EXISTS child_id")
    op.execute("ALTER TABLE child_support_profiles DROP COLUMN IF EXISTS annual_review_due")
    op.execute("ALTER TABLE children DROP COLUMN IF EXISTS buddy_name")
    op.execute("ALTER TABLE children DROP COLUMN IF EXISTS room_name")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS theme_preference")
    op.execute("ALTER TABLE schools DROP COLUMN IF EXISTS lead_senco_name")
    op.execute("ALTER TABLE schools DROP COLUMN IF EXISTS local_authority")
    op.execute("ALTER TABLE schools DROP COLUMN IF EXISTS phase")
    op.execute("ALTER TABLE schools DROP COLUMN IF EXISTS urn_number")
