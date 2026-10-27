from pydantic import BaseModel, ConfigDict


class SchoolAnalyticsOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    school_name: str
    total_send_pupils: int
    ehcp_count: int
    sen_support_count: int
    total_weekly_ta_hours_allocated: float
    total_weekly_ta_hours_delivered: float
    provision_delivery_rate: float  # Percentage (e.g. 96.2)
    overall_de_escalation_win_rate: float  # Percentage (e.g. 91.4)
    de_escalation_observation_count: int
    total_incidents_this_term: int
    peak_vulnerability_window: str
    peak_vulnerability_count: int
    annual_reviews_recorded: int
    annual_reviews_on_track: int
    annual_reviews_missing: int
    annual_reviews_on_track_rate: float  # Percentage (e.g. 100.0)


class HeatmapPeriodSlot(BaseModel):
    period_id: str
    period_label: str
    time_window: str
    incident_counts: dict[str, int]  # {"mon": 1, "tue": 0, "wed": 4, "thu": 1, "fri": 2}
    total_count: int
    intensity: str  # "none", "low", "medium", "high"


class IncidentHeatmapResponse(BaseModel):
    days: list[str]
    day_keys: list[str]
    periods: list[HeatmapPeriodSlot]
    total_incidents: int
    peak_window: str


class TriggerCategoryMetric(BaseModel):
    category: str
    label: str
    count: int
    percentage: float
    primary_antecedent_examples: list[str]


class TriggersReportResponse(BaseModel):
    total_recorded_triggers: int
    triggers: list[TriggerCategoryMetric]


class StrategyWinRateMetric(BaseModel):
    strategy_id: str
    title: str
    category: str
    total_attempts: int
    successful_resolutions: int
    win_rate_percentage: float
    avg_recovery_minutes: int
    recommended_for: list[str]


class StrategyEfficacyResponse(BaseModel):
    overall_win_rate: float
    total_strategies_evaluated: int
    strategies: list[StrategyWinRateMetric]


class FundingBandBreakdown(BaseModel):
    band: str
    annual_amount_per_pupil: str
    pupil_count: int
    total_funding: str
    weekly_ta_hours_allocated: float
    weekly_ta_hours_delivered: float
    delivery_compliance_percentage: float


class ProvisionAuditResponse(BaseModel):
    school_name: str
    academic_year: str
    total_high_needs_funding: str
    total_allocated_ta_hours: float
    total_delivered_ta_hours: float
    overall_compliance_rate: float
    bands: list[FundingBandBreakdown]
