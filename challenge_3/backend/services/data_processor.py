import polars as pl
from pathlib import Path
from typing import Optional

class CovidDataProcessor:
    """Process COVID-19 data using Polars for high performance"""
    
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self._df: Optional[pl.DataFrame] = None
        self._load_data()
    
    def _load_data(self):
        """Load CSV data with Polars"""
        # Define null values to handle special cases
        null_values = ["__NA__", "Prefer not to say", "Not sure", ""]
        
        self._df = pl.read_csv(
            self.data_path,
            null_values=null_values,
            infer_schema_length=10000,
            ignore_errors=True
        )
        
        # Convert endtime to datetime
        self._df = self._df.with_columns([
            pl.col("endtime").str.strptime(pl.Datetime, "%d/%m/%Y %H:%M", strict=False).alias("datetime")
        ])
    
    def get_overview_stats(self) -> dict:
        """Get KPI statistics for dashboard cards"""
        total_records = len(self._df)
        
        # Average health score (cantril_ladder)
        # Cast to float with strict=False to handle invalid values
        avg_health_score = self._df.select(
            pl.col("cantril_ladder").cast(pl.Float64, strict=False).mean()
        ).item()
        
        # Compliance rate - tính TRUNG BÌNH compliance của tất cả 20 behaviors
        # Mỗi behavior: Always/Frequently = compliant
        compliance_cols = [f"i12_health_{i}" for i in range(1, 21)]
        existing_cols = [col for col in compliance_cols if col in self._df.columns]
        
        if existing_cols:
            # Tính compliance rate cho từng behavior, rồi lấy trung bình
            total_compliance = 0
            for col in existing_cols:
                compliant_count = self._df.filter(
                    pl.col(col).is_in(["Always", "Frequently"])
                ).height
                behavior_rate = (compliant_count / total_records * 100) if total_records > 0 else 0
                total_compliance += behavior_rate
            
            compliance_rate = total_compliance / len(existing_cols) if existing_cols else 0
        else:
            compliance_rate = 0
        
        return {
            "total_surveys": total_records,
            "avg_health_score": round(avg_health_score, 1) if avg_health_score else 0,
            "compliance_rate": round(compliance_rate, 1)
        }
    
    def get_timeline_data(self, week_start: Optional[int] = None, week_end: Optional[int] = None) -> dict:
        """Get timeline data by week"""
        df = self._df.clone()
        
        # Filter by week if specified
        if week_start is not None or week_end is not None:
            start = week_start or 1
            end = week_end or 12
            df = df.filter(
                pl.col("qweek").str.contains(f"week ({start}|{end}|[{start}-{end}])")
            )
        
        # Group by week
        timeline = df.group_by("qweek").agg([
            pl.count().alias("count"),
            pl.col("i1_health").cast(pl.Float64, strict=False).mean().alias("avg_health"),
            pl.col("cantril_ladder").cast(pl.Float64, strict=False).mean().alias("avg_mental_health")
        ]).sort("qweek")
        
        return {
            "weeks": timeline["qweek"].to_list(),
            "survey_counts": timeline["count"].to_list(),
            "avg_health": timeline["avg_health"].fill_nan(None).to_list(),
            "avg_mental_health": timeline["avg_mental_health"].fill_nan(None).to_list()
        }
    
    def get_region_data(self) -> dict:
        """Get data grouped by region"""
        region_stats = self._df.group_by("region").agg([
            pl.count().alias("count"),
            pl.col("i1_health").cast(pl.Float64, strict=False).mean().alias("avg_health"),
            pl.col("cantril_ladder").cast(pl.Float64, strict=False).mean().alias("avg_mental_health")
        ]).sort("count", descending=True)
        
        return {
            "regions": region_stats["region"].to_list(),
            "counts": region_stats["count"].to_list(),
            "avg_health": region_stats["avg_health"].fill_nan(None).to_list(),
            "avg_mental_health": region_stats["avg_mental_health"].fill_nan(None).to_list()
        }
    
    def get_demographics(self) -> dict:
        """Get demographic distribution"""
        # Gender distribution
        gender_dist = self._df.group_by("gender").agg([
            pl.count().alias("count")
        ])
        
        # Age distribution (group into ranges)
        age_groups = self._df.with_columns([
            pl.when(pl.col("age") < 25).then(pl.lit("18-24"))
            .when(pl.col("age") < 35).then(pl.lit("25-34"))
            .when(pl.col("age") < 50).then(pl.lit("35-49"))
            .when(pl.col("age") < 65).then(pl.lit("50-64"))
            .otherwise(pl.lit("65+"))
            .alias("age_group")
        ]).group_by("age_group").agg([
            pl.count().alias("count")
        ]).sort("age_group")
        
        # Employment status
        employment_cols = [f"employment_status_{i}" for i in range(1, 8)]
        existing_emp_cols = [col for col in employment_cols if col in self._df.columns]
        
        employment_data = []
        if existing_emp_cols:
            for col in existing_emp_cols:
                yes_count = self._df.filter(pl.col(col) == "Yes").height
                if yes_count > 0:
                    employment_data.append({
                        "status": col.replace("employment_status_", "Status "),
                        "count": yes_count
                    })
        
        return {
            "gender": {
                "labels": gender_dist["gender"].to_list(),
                "values": gender_dist["count"].to_list()
            },
            "age_groups": {
                "labels": age_groups["age_group"].to_list(),
                "values": age_groups["count"].to_list()
            },
            "employment": employment_data
        }
    
    def get_health_mental_data(self) -> dict:
        """Get mental health and PHQ4 scores"""
        # PHQ4 scores (anxiety and depression)
        phq_cols = [f"PHQ4_{i}" for i in range(1, 5)]
        existing_phq = [col for col in phq_cols if col in self._df.columns]
        
        phq_data = {}
        for col in existing_phq:
            score_dist = self._df.group_by(col).agg([
                pl.count().alias("count")
            ]).sort(col)
            phq_data[col] = {
                "scores": score_dist[col].to_list(),
                "counts": score_dist["count"].to_list()
            }
        
        # Cantril ladder distribution
        cantril_dist = self._df.group_by("cantril_ladder").agg([
            pl.count().alias("count")
        ]).sort("cantril_ladder")
        
        return {
            "phq4": phq_data,
            "cantril_ladder": {
                "scores": cantril_dist["cantril_ladder"].to_list(),
                "counts": cantril_dist["count"].to_list()
            }
        }
    
    def get_vaccination_data(self) -> dict:
        """Get vaccination statistics"""
        # v1: Have you been vaccinated?
        v1_dist = self._df.group_by("v1").agg([
            pl.count().alias("count")
        ])
        
        # Count vaccine types (v2_1 to v2_5)
        vaccine_type_cols = [f"v2_{i}" for i in range(1, 6)]
        existing_v2 = [col for col in vaccine_type_cols if col in self._df.columns]
        
        vaccine_types = []
        for col in existing_v2:
            yes_count = self._df.filter(pl.col(col) == "Yes").height
            if yes_count > 0:
                vaccine_types.append({
                    "type": col.replace("v2_", "Vaccine Type "),
                    "count": yes_count
                })
        
        return {
            "status": {
                "labels": v1_dist["v1"].to_list() if "v1" in v1_dist.columns else [],
                "values": v1_dist["count"].to_list() if "v1" in v1_dist.columns else []
            },
            "types": vaccine_types
        }
    
    def get_filter_options(self) -> dict:
        """Get available filter options"""
        return {
            "regions": self._df["region"].unique().to_list(),
            "weeks": sorted(self._df["qweek"].unique().to_list()),
            "age_range": {
                "min": int(self._df["age"].min()),
                "max": int(self._df["age"].max())
            }
        }
    
    def filter_data(
        self,
        regions: Optional[list[str]] = None,
        week_start: Optional[int] = None,
        week_end: Optional[int] = None,
        age_min: Optional[int] = None,
        age_max: Optional[int] = None,
        gender: Optional[str] = None
    ):
        """Apply filters to the dataset"""
        df = self._df.clone()
        
        if regions:
            df = df.filter(pl.col("region").is_in(regions))
        
        if week_start or week_end:
            start = week_start or 1
            end = week_end or 12
            pattern = f"week ({start}|{end}|[{start}-{end}])"
            df = df.filter(pl.col("qweek").str.contains(pattern))
        
        if age_min is not None:
            df = df.filter(pl.col("age") >= age_min)
        
        if age_max is not None:
            df = df.filter(pl.col("age") <= age_max)
        
        if gender:
            df = df.filter(pl.col("gender") == gender)
        
        # Temporarily update the dataframe
        original_df = self._df
        self._df = df
        
        return original_df
    
    def restore_data(self, original_df):
        """Restore original dataframe after filtering"""
        self._df = original_df

    def get_mental_health_government_data(self) -> dict:
        """Get comprehensive mental health and government response data"""
        
        # Define systematic ordinal scales for categorical data
        # These are ordered from worst/least to best/most
        trust_scale = {
            "No confidence at all": 1,
            "Not very much confidence": 2,
            "A fair amount of confidence": 3,
            "A lot of confidence": 4
        }
        
        handling_scale = {
            "Very badly": 1,
            "Somewhat badly": 2,
            "Somewhat well": 3,
            "Very well": 4
        }
        
        fear_scale = {
            "I am not at all scared that I will contract the Coronavirus (COVID-19)": 1,
            "I am not very scared that I will contract the Coronavirus (COVID-19)": 2,
            "I am fairly scared that I will contract the Coronavirus (COVID-19)": 3,
            "I am very scared that I will contract the Coronavirus (COVID-19)": 4
        }
        
        # Cantril Ladder summary (life satisfaction 0-10)
        cantril_avg = self._df.select(
            pl.col("cantril_ladder").cast(pl.Float64, strict=False).mean()
        ).item()
        
        # Filter valid cantril_ladder values (numeric and in range 0-10)
        cantril_filtered = self._df.filter(
            pl.col("cantril_ladder").cast(pl.Float64, strict=False).is_between(0, 10, closed="both")
        )
        
        cantril_dist = cantril_filtered.group_by("cantril_ladder").agg([
            pl.count().alias("count")
        ]).sort("cantril_ladder")
        
        cantril_summary = {
            "average": round(cantril_avg, 2) if cantril_avg else 0,
            "distribution": [
                {
                    "score": int(float(row[0])) if row[0] is not None else 0, 
                    "count": row[1]
                }
                for row in cantril_dist.iter_rows()
            ]
        }
        
        # PHQ4 metrics (mental health indicators)
        phq_cols = ["PHQ4_1", "PHQ4_2", "PHQ4_3", "PHQ4_4"]
        phq_labels = [
            "Nervous/Anxious",
            "Can't Stop Worrying", 
            "Little Interest",
            "Feeling Down"
        ]
        
        phq4_metrics = []
        for col, label in zip(phq_cols, phq_labels):
            if col in self._df.columns:
                dist = self._df.group_by(col).agg([
                    pl.count().alias("count")
                ]).sort(col)
                
                phq4_metrics.append({
                    "metric": label,
                    "column": col,
                    "distribution": [
                        {"level": str(row[0]) if row[0] is not None else "Unknown", "count": row[1]}
                        for row in dist.iter_rows()
                    ]
                })
        
        # Government trust (WCRex2 - trust in health system)
        gov_trust = {"average": 0, "distribution": []}
        if "WCRex2" in self._df.columns:
            # Map text to numeric and calculate average
            valid_trust = self._df.filter(
                pl.col("WCRex2").is_in(list(trust_scale.keys()))
            )
            
            if len(valid_trust) > 0:
                # Create numeric mapping with casting to Int64
                trust_mapped = valid_trust.with_columns(
                    pl.col("WCRex2").replace(trust_scale).cast(pl.Int64).alias("trust_score")
                )
                trust_avg = trust_mapped.select(pl.col("trust_score").mean()).item()
                # Normalize to 0-10 scale: (score-1)/(4-1) * 10
                normalized_avg = round((trust_avg - 1) / 3 * 10, 1) if trust_avg else 0
            else:
                normalized_avg = 0
            
            trust_dist = self._df.group_by("WCRex2").agg([
                pl.count().alias("count")
            ]).sort("WCRex2")
            
            gov_trust = {
                "average": normalized_avg,
                "distribution": [
                    {"level": str(row[0]) if row[0] is not None else "Unknown", "count": row[1]}
                    for row in trust_dist.iter_rows()
                ]
            }
        
        # Pandemic handling (WCRex1 - gov't handling of pandemic)
        pandemic_handling = {"average": 0, "distribution": []}
        if "WCRex1" in self._df.columns:
            # Map text to numeric and calculate average
            valid_handling = self._df.filter(
                pl.col("WCRex1").is_in(list(handling_scale.keys()))
            )
            
            if len(valid_handling) > 0:
                handling_mapped = valid_handling.with_columns(
                    pl.col("WCRex1").replace(handling_scale).cast(pl.Int64).alias("handling_score")
                )
                handling_avg = handling_mapped.select(pl.col("handling_score").mean()).item()
                # Normalize to 0-10 scale: (score-1)/(4-1) * 10
                normalized_avg = round((handling_avg - 1) / 3 * 10, 1) if handling_avg else 0
            else:
                normalized_avg = 0
            
            handling_dist = self._df.group_by("WCRex1").agg([
                pl.count().alias("count")
            ]).sort("WCRex1")
            
            pandemic_handling = {
                "average": normalized_avg,
                "distribution": [
                    {"level": str(row[0]) if row[0] is not None else "Unknown", "count": row[1]}
                    for row in handling_dist.iter_rows()
                ]
            }
        
        # Fear level (WCRV_4 - fear of getting COVID)
        fear_level = {"average": 0, "distribution": []}
        if "WCRV_4" in self._df.columns:
            # Map text to numeric and calculate average
            valid_fear = self._df.filter(
                pl.col("WCRV_4").is_in(list(fear_scale.keys()))
            )
            
            if len(valid_fear) > 0:
                fear_mapped = valid_fear.with_columns(
                    pl.col("WCRV_4").replace(fear_scale).cast(pl.Int64).alias("fear_score")
                )
                fear_avg = fear_mapped.select(pl.col("fear_score").mean()).item()
                # Normalize to 0-10 scale: (score-1)/(4-1) * 10
                normalized_avg = round((fear_avg - 1) / 3 * 10, 1) if fear_avg else 0
            else:
                normalized_avg = 0
            
            fear_dist = self._df.group_by("WCRV_4").agg([
                pl.count().alias("count")
            ]).sort("WCRV_4")
            
            fear_level = {
                "average": normalized_avg,
                "distribution": [
                    {"level": str(row[0]) if row[0] is not None else "Unknown", "count": row[1]}
                    for row in fear_dist.iter_rows()
                ]
            }
        
        # Correlation data (mental health vs government response)
        # Use same systematic ordinal scale as pandemic_handling for consistency
        correlation_data = []
        if all(col in self._df.columns for col in ["cantril_ladder", "WCRex1"]):
            # Filter valid cantril_ladder values (0-10) and valid WCRex1 responses
            valid_df = self._df.filter(
                pl.col("cantril_ladder").is_in([str(i) for i in range(11)]) &
                pl.col("WCRex1").is_in(list(handling_scale.keys()))
            )
            
            # Group by WCRex1 and calculate average cantril_ladder
            if len(valid_df) > 0:
                grouped = valid_df.group_by("WCRex1").agg([
                    pl.col("cantril_ladder").cast(pl.Int64).mean().alias("avg_mental_health"),
                    pl.count().alias("count")
                ])
                
                for row in grouped.iter_rows():
                    gov_response_text = row[0]
                    avg_mental_health = row[1]
                    count = row[2]
                    
                    # Map using systematic ordinal scale (1-4)
                    gov_response_score = handling_scale.get(gov_response_text)
                    
                    if avg_mental_health is not None and gov_response_score is not None and count > 10:
                        correlation_data.append({
                            "mental_health": round(avg_mental_health, 2),
                            "gov_response": gov_response_score,  # Now 1-4 scale
                            "category": gov_response_text,
                            "count": count
                        })
        
        return {
            "cantril_summary": cantril_summary,
            "phq4_metrics": phq4_metrics,
            "government_trust": gov_trust,
            "pandemic_handling": pandemic_handling,
            "fear_level": fear_level,
            "correlation_data": correlation_data[:500]  # Limit to 500 points
        }

    def get_compliance_knowledge_data(self) -> dict:
        """Get compliance behaviors and COVID knowledge data - OPTIMIZED"""
        
        # i12_health behaviors (1-20)
        i12_cols = [f"i12_health_{i}" for i in range(1, 21)]
        existing_i12 = [col for col in i12_cols if col in self._df.columns]
        
        behavior_labels = {
            "i12_health_1": "Wash hands",
            "i12_health_2": "Use sanitizer",
            "i12_health_3": "Avoid touching face",
            "i12_health_4": "Clean surfaces",
            "i12_health_5": "Wear mask",
            "i12_health_6": "Social distancing",
            "i12_health_7": "Avoid crowds",
            "i12_health_8": "Stay home when sick",
            "i12_health_9": "Cover cough/sneeze",
            "i12_health_10": "Avoid handshake",
            "i12_health_11": "Clean groceries",
            "i12_health_12": "Ventilate room",
            "i12_health_13": "Monitor symptoms",
            "i12_health_14": "Follow guidelines",
            "i12_health_15": "Isolate if exposed",
            "i12_health_16": "Download contact tracing",
            "i12_health_17": "Share health info",
            "i12_health_18": "Get tested",
            "i12_health_19": "Inform contacts",
            "i12_health_20": "Follow quarantine"
        }
        
        # OPTIMIZATION: Vectorized operations to minimize dataframe scans
        total_records = self._df.height
        top_behaviors = []
        compliance_matrix = []
        
        for col in existing_i12[:20]:
            # Vectorized compliance calculation
            is_compliant = pl.col(col).is_in(["Always", "Frequently"])
            
            # Overall compliance rate
            compliance_count = self._df.select(is_compliant.sum()).item()
            compliance_rate = (compliance_count / total_records * 100) if total_records > 0 else 0
            
            # Distribution using single group_by
            dist = self._df.group_by(col).agg([pl.count().alias("count")])
            distribution = [
                {"level": str(row[0]) if row[0] is not None else "Unknown", "count": row[1]}
                for row in dist.iter_rows()
            ]
            
            top_behaviors.append({
                "behavior": behavior_labels.get(col, col),
                "compliance_rate": round(compliance_rate, 1),
                "distribution": distribution
            })
            
            # Heatmap: single group_by per behavior instead of 12 filters
            week_stats = self._df.group_by("qweek").agg([
                pl.count().alias("total"),
                is_compliant.sum().alias("compliant")
            ])
            
            # Create lookup dict for O(1) access
            week_lookup = {
                row[0]: (row[2] / row[1] * 100) if row[1] > 0 else 0
                for row in week_stats.iter_rows()
            }
            
            # Build week_compliance array (12 weeks)
            week_compliance = [
                week_lookup.get(f"week {week}", 0)
                for week in range(1, 13)
            ]
            compliance_matrix.append(week_compliance)
        
        # Sort by compliance rate
        top_behaviors.sort(key=lambda x: x["compliance_rate"], reverse=True)
        
        # Overall compliance overview
        total_records = self._df.height
        high_compliance = self._df.filter(
            pl.any_horizontal([
                pl.col(col) == "Always"
                for col in existing_i12[:10]  # Check first 10 behaviors
            ])
        ).height
        
        compliance_overview = {
            "overall_rate": round((high_compliance / total_records * 100), 1) if total_records > 0 else 0,
            "total_behaviors_tracked": len(existing_i12),
            "high_compliance_count": high_compliance
        }
        
        # Knowledge scores (r1_1 to r1_7)
        r1_cols = [f"r1_{i}" for i in range(1, 8)]
        existing_r1 = [col for col in r1_cols if col in self._df.columns]
        
        knowledge_labels = {
            "r1_1": "COVID is very dangerous for me",
            "r1_2": "Likely to catch COVID in future",
            "r1_3": "Mask will protect me",
            "r1_4": "Mask will protect others",
            "r1_5": "Mask protection not possible for me",
            "r1_6": "Important to improve health",
            "r1_7": "Life greatly affected by COVID"
        }
        
        knowledge_scores = []
        # Define all 7 Likert scale levels
        all_levels = ['1 – Disagree', '2', '3', '4', '5', '6', '7 - Agree']
        
        for col in existing_r1:
            dist = self._df.group_by(col).agg([
                pl.count().alias("count")
            ])
            
            # Create dictionary for lookup
            count_dict = {str(row[0]): row[1] for row in dist.iter_rows() if row[0] is not None}
            
            # Ensure all 7 levels are present (fill missing with 0)
            full_distribution = [
                {"answer": level, "count": count_dict.get(level, 0)}
                for level in all_levels
            ]
            
            knowledge_scores.append({
                "question": knowledge_labels.get(col, col),
                "distribution": full_distribution
            })
        
        # Awareness level: calculate % based on ACTUAL knowledge questions only
        # Only r1_3, r1_4, r1_5 are true knowledge questions
        # r1_1, r1_2, r1_6, r1_7 are attitudes/perceptions - excluded
        awareness_level = {
            "high_awareness": 0,
            "medium_awareness": 0,
            "low_awareness": 0
        }
        
        # Define knowledge questions and their correct answers
        knowledge_questions = {
            'r1_3': 'positive',  # "Mask protects ME" → Agree (5-7) = correct
            'r1_4': 'positive',  # "Mask protects OTHERS" → Agree (5-7) = correct
            'r1_5': 'negative'   # "Mask NOT POSSIBLE for me" → Disagree (1-3) = correct
        }
        
        # Filter to only existing knowledge columns
        existing_knowledge = [col for col in knowledge_questions.keys() if col in self._df.columns]
        
        if existing_knowledge:
            # Create expressions for correct answers per question
            correct_answer_exprs = []
            for col in existing_knowledge:
                if knowledge_questions[col] == 'positive':
                    # Positive: Agree (5-7) = correct
                    correct_expr = pl.col(col).is_in(['5', '6', '7 - Agree']).cast(pl.Int32)
                else:
                    # Negative (r1_5): Disagree (1-3) = correct
                    correct_expr = pl.col(col).is_in(['1 – Disagree', '2', '3']).cast(pl.Int32)
                correct_answer_exprs.append(correct_expr)
            
            # Count correct answers per person
            df_with_awareness = self._df.select([
                sum(correct_answer_exprs).alias("correct_answers")
            ])
            
            total = df_with_awareness.height
            total_knowledge_questions = len(existing_knowledge)
            
            # High awareness: >= 2/3 questions correct (66.7%)
            high = df_with_awareness.filter(
                pl.col("correct_answers") >= total_knowledge_questions * 2/3
            ).height
            
            # Low awareness: < 1/3 questions correct (33.3%)
            low = df_with_awareness.filter(
                pl.col("correct_answers") < total_knowledge_questions * 1/3
            ).height
            
            # Medium awareness: 1/3 to 2/3 correct
            medium = total - high - low
            
            # Calculate percentages ensuring they sum to 100
            high_pct = round((high / total * 100), 1) if total > 0 else 0
            low_pct = round((low / total * 100), 1) if total > 0 else 0
            medium_pct = round(100 - high_pct - low_pct, 1) if total > 0 else 0
            
            awareness_level = {
                "high_awareness": high_pct,
                "medium_awareness": medium_pct,
                "low_awareness": low_pct
            }
        
        # Behavior clusters (group similar compliance patterns)
        behavior_clusters = [
            {
                "cluster": "Health Hygiene",
                "behaviors": ["Wash hands", "Use sanitizer", "Clean surfaces"],
                "avg_compliance": round(sum(b["compliance_rate"] for b in top_behaviors[:3]) / 3, 1) if len(top_behaviors) >= 3 else 0
            },
            {
                "cluster": "Social Distancing", 
                "behaviors": ["Avoid crowds", "Social distancing", "Stay home when sick"],
                "avg_compliance": round(sum(b["compliance_rate"] for b in top_behaviors[5:8]) / 3, 1) if len(top_behaviors) >= 8 else 0
            },
            {
                "cluster": "Prevention Measures",
                "behaviors": ["Wear mask", "Cover cough/sneeze", "Avoid touching face"],
                "avg_compliance": round(sum(b["compliance_rate"] for b in top_behaviors[3:6]) / 3, 1) if len(top_behaviors) >= 6 else 0
            }
        ]
        
        return {
            "compliance_overview": compliance_overview,
            "top_behaviors": top_behaviors[:15],  # Top 15 behaviors
            "compliance_heatmap": compliance_matrix[:15],  # 15 behaviors x 12 weeks
            "knowledge_scores": knowledge_scores,
            "awareness_level": awareness_level,
            "behavior_clusters": behavior_clusters
        }
