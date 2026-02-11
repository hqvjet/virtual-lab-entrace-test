from pydantic import BaseModel
from typing import Optional, List

class OverviewStats(BaseModel):
    total_surveys: int
    avg_health_score: float
    compliance_rate: float

class TimelineData(BaseModel):
    weeks: List[str]
    survey_counts: List[int]
    avg_health: List[Optional[float]]
    avg_mental_health: List[Optional[float]]

class RegionData(BaseModel):
    regions: List[str]
    counts: List[int]
    avg_health: List[Optional[float]]
    avg_mental_health: List[Optional[float]]

class GenderDistribution(BaseModel):
    labels: List[str]
    values: List[int]

class AgeGroupDistribution(BaseModel):
    labels: List[str]
    values: List[int]

class EmploymentStatus(BaseModel):
    status: str
    count: int

class Demographics(BaseModel):
    gender: GenderDistribution
    age_groups: AgeGroupDistribution
    employment: List[EmploymentStatus]

class PHQDistribution(BaseModel):
    scores: List[Optional[str]]
    counts: List[int]

class CantrilLadder(BaseModel):
    scores: List[Optional[str]]
    counts: List[int]

class HealthMentalData(BaseModel):
    phq4: dict
    cantril_ladder: CantrilLadder

class VaccinationStatus(BaseModel):
    labels: List[str]
    values: List[int]

class VaccineType(BaseModel):
    type: str
    count: int

class VaccinationData(BaseModel):
    status: VaccinationStatus
    types: List[VaccineType]

class FilterOptions(BaseModel):
    regions: List[str]
    weeks: List[str]
    age_range: dict

class FilterParams(BaseModel):
    regions: Optional[List[str]] = None
    week_start: Optional[int] = None
    week_end: Optional[int] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Optional[str] = None

# Mental Health & Government Response Models
class MentalHealthScore(BaseModel):
    metric: str
    avg_score: float
    distribution: List[dict]

class GovernmentResponseScore(BaseModel):
    metric: str
    avg_score: float
    distribution: List[dict]

class MentalHealthGovernmentData(BaseModel):
    cantril_summary: dict
    phq4_metrics: List[dict]
    government_trust: dict
    pandemic_handling: dict
    fear_level: dict
    correlation_data: List[dict]

# Compliance & Knowledge Models  
class ComplianceBehavior(BaseModel):
    behavior: str
    compliance_rate: float
    distribution: List[dict]

class KnowledgeMetric(BaseModel):
    question: str
    correct_rate: float
    distribution: List[dict]

class ComplianceKnowledgeData(BaseModel):
    compliance_overview: dict
    top_behaviors: List[dict]
    compliance_heatmap: List[List[float]]
    knowledge_scores: List[dict]
    awareness_level: dict
    behavior_clusters: List[dict]
