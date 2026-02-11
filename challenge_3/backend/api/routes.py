from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from api.models import (
    OverviewStats, TimelineData, RegionData, Demographics,
    HealthMentalData, VaccinationData, FilterOptions,
    MentalHealthGovernmentData, ComplianceKnowledgeData
)
from services.data_processor import CovidDataProcessor

router = APIRouter(prefix="/api", tags=["covid-data"])

# Initialize data processor (will be set in main.py)
data_processor: Optional[CovidDataProcessor] = None

def set_data_processor(processor: CovidDataProcessor):
    global data_processor
    data_processor = processor

@router.get("/overview", response_model=OverviewStats)
async def get_overview(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get overview KPI statistics"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters if any
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        stats = data_processor.get_overview_stats()
        return OverviewStats(**stats)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/timeline", response_model=TimelineData)
async def get_timeline(
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    regions: Optional[List[str]] = Query(None),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get timeline data by week"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        timeline = data_processor.get_timeline_data(week_start, week_end)
        return TimelineData(**timeline)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/regions", response_model=RegionData)
async def get_regions(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get data grouped by region"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        region_data = data_processor.get_region_data()
        return RegionData(**region_data)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/demographics", response_model=Demographics)
async def get_demographics(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get demographic distribution"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        demographics = data_processor.get_demographics()
        return Demographics(**demographics)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/health-mental", response_model=HealthMentalData)
async def get_health_mental(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get mental health statistics"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        health_mental = data_processor.get_health_mental_data()
        return HealthMentalData(**health_mental)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/vaccination", response_model=VaccinationData)
async def get_vaccination(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get vaccination statistics"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        vaccination = data_processor.get_vaccination_data()
        return VaccinationData(**vaccination)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/filters", response_model=FilterOptions)
async def get_filter_options():
    """Get available filter options"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    filters = data_processor.get_filter_options()
    return FilterOptions(**filters)

@router.get("/mental-health-government", response_model=MentalHealthGovernmentData)
async def get_mental_health_government(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get mental health and government response comprehensive data"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        data = data_processor.get_mental_health_government_data()
        return MentalHealthGovernmentData(**data)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

@router.get("/compliance-knowledge", response_model=ComplianceKnowledgeData)
async def get_compliance_knowledge(
    regions: Optional[List[str]] = Query(None),
    week_start: Optional[int] = Query(None, ge=1, le=12),
    week_end: Optional[int] = Query(None, ge=1, le=12),
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=120),
    gender: Optional[str] = Query(None)
):
    """Get compliance behaviors and COVID knowledge data"""
    if not data_processor:
        raise HTTPException(status_code=500, detail="Data processor not initialized")
    
    # Apply filters
    original_df = None
    if any([regions, week_start, week_end, age_min, age_max, gender]):
        original_df = data_processor.filter_data(
            regions=regions,
            week_start=week_start,
            week_end=week_end,
            age_min=age_min,
            age_max=age_max,
            gender=gender
        )
    
    try:
        data = data_processor.get_compliance_knowledge_data()
        return ComplianceKnowledgeData(**data)
    finally:
        if original_df is not None:
            data_processor.restore_data(original_df)

