from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EvidenceCitation(BaseModel):
    citation_text: str
    snippet: str | None = None
    event_id: UUID | None = None
    chunk_id: UUID | None = None


class MorningBriefingResponse(BaseModel):
    child_id: UUID
    child_name: str
    briefing_date: str
    summary_markdown: str
    recommended_focus: list[str]
    citations: list[EvidenceCitation]
    confidence_level: str = "High"


class AskNoyaRequest(BaseModel):
    child_id: UUID
    question: str
    top_k: int = 5


class AskNoyaResponse(BaseModel):
    question: str
    answer_markdown: str
    citations: list[EvidenceCitation]
    model_used: str
    latency_ms: int


class AIRunAuditResponse(BaseModel):
    id: UUID
    created_at: datetime
    requester_role: str
    prompt_type: str
    model_name: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    status: str
    child_id: UUID | None = None
    input_prompt: str | None = None
    output_text: str | None = None


class NoyaChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class NoyaCopilotChatRequest(BaseModel):
    child_id: UUID | None = None
    active_view: str | None = None
    message: str
    history: list[NoyaChatMessage] = []


class NoyaCopilotChatResponse(BaseModel):
    answer_markdown: str
    action_card: dict | None = None
    suggested_followups: list[str] = []
    tool_called: str | None = None
    citations: list[EvidenceCitation] = []
    model_used: str = "noya-agent"
    latency_ms: int = 0

