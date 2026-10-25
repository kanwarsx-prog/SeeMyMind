from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import TimestampedUUIDModel

# Graceful fallback for vector column in local SQLite test environments
try:
    from pgvector.sqlalchemy import Vector

    EmbeddingColumnType = Vector(1536)
except ImportError:
    EmbeddingColumnType = JSON


class RAGSourceDocument(TimestampedUUIDModel):
    """Raw EHCP, assessment or meeting document ingested for RAG retrieval."""

    __tablename__ = "rag_source_documents"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    school_id = Column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title = Column(String(255), nullable=False)
    document_type = Column(
        String(50), nullable=False
    )  # "EHCP", "Annual Review", "EP Report", "Speech Therapy"
    storage_path = Column(String(500), nullable=False)  # Supabase Storage path
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), default="application/pdf")
    is_indexed = Column(Boolean, default=False, nullable=False)

    chunks = relationship(
        "RAGChunkIndex", back_populates="source_document", cascade="all, delete-orphan"
    )


class RAGChunkIndex(TimestampedUUIDModel):
    """Document text chunks with native pgvector embeddings for two-stage retrieval."""

    __tablename__ = "rag_chunk_indexes"

    source_document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rag_source_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    school_id = Column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=True, index=True
    )

    chunk_index = Column(Integer, nullable=False)
    section_heading = Column(
        String(200), nullable=True
    )  # e.g. "Section F: Special Educational Provision"
    chunk_text = Column(Text, nullable=False)
    embedding = Column(EmbeddingColumnType, nullable=True)
    token_count = Column(Integer, nullable=True)

    source_document = relationship("RAGSourceDocument", back_populates="chunks")


class AIRun(TimestampedUUIDModel):
    """Immutable audit trail for every AI / LLM invocation."""

    __tablename__ = "ai_runs"

    requester_id = Column(UUID(as_uuid=True), nullable=True)
    requester_role = Column(String(50), nullable=False)  # "Teacher", "SENCO", "System"
    prompt_type = Column(
        String(50), nullable=False
    )  # "MorningBriefing", "EHCP_EvidenceSummary", "AskNOYA"
    model_name = Column(String(50), nullable=False)  # "gpt-4o", "gpt-4o-mini"
    prompt_version = Column(String(20), default="1.0")

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    input_prompt = Column(Text, nullable=True)
    output_text = Column(Text, nullable=True)

    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    status = Column(String(50), default="Success")  # "Success", "Failed", "Filtered_Guardrail"

    insights = relationship("AIInsight", back_populates="run")


class AIInsight(TimestampedUUIDModel):
    """Generated advisory outputs. Never the unreviewed system of record."""

    __tablename__ = "ai_insights"

    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    run_id = Column(
        UUID(as_uuid=True), ForeignKey("ai_runs.id", ondelete="SET NULL"), nullable=True
    )

    insight_type = Column(
        String(50), nullable=False
    )  # "MorningBriefing", "EOD_ParentSummary", "EHCP_EvidenceDraft"
    title = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)

    confidence_level = Column(String(20), default="High")  # "High", "Medium", "Requires Caution"
    review_status = Column(String(50), default="Draft")  # "Draft", "Approved", "Edited", "Rejected"
    reviewed_by_id = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    child = relationship("Child", back_populates="ai_insights")
    run = relationship("AIRun", back_populates="insights")
    evidence_citations = relationship(
        "AIInsightEvidence", back_populates="insight", cascade="all, delete-orphan"
    )


class AIInsightEvidence(TimestampedUUIDModel):
    """Concrete citations linking an AI claim to an actual observation, event, or document chunk."""

    __tablename__ = "ai_insight_evidence"

    insight_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_insights.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_id = Column(
        UUID(as_uuid=True), ForeignKey("rag_chunk_indexes.id", ondelete="SET NULL"), nullable=True
    )
    event_id = Column(
        UUID(as_uuid=True), ForeignKey("child_events.id", ondelete="SET NULL"), nullable=True
    )
    citation_text = Column(String(255), nullable=False)  # e.g. "Morning Handover on 2026-10-21"
    snippet = Column(Text, nullable=True)

    insight = relationship("AIInsight", back_populates="evidence_citations")
