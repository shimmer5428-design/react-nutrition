from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional

from supabase_client import get_client

router = APIRouter()


class WeekPlanPayload(BaseModel):
    week_id: str
    person_name: str
    day_of_week: int
    data: dict[str, Any]


class WeekPlanBulkPayload(BaseModel):
    week_id: str
    person_name: str
    days: list[dict[str, Any]]  # list of 7 day-plan dicts, index = day_of_week


@router.get("/")
def list_week_plans(week_id: Optional[str] = None, person_name: Optional[str] = None):
    client = get_client()
    query = client.table("week_plans").select("*")
    if week_id:
        query = query.eq("week_id", week_id)
    if person_name:
        query = query.eq("person_name", person_name)
    response = query.order("week_id").order("person_name").order("day_of_week").execute()
    return response.data


@router.post("/")
def upsert_week_plan(payload: WeekPlanPayload):
    client = get_client()
    row = {
        "week_id": payload.week_id,
        "person_name": payload.person_name,
        "day_of_week": payload.day_of_week,
        "data": payload.data,
    }
    response = (
        client.table("week_plans")
        .upsert(row, on_conflict="week_id,person_name,day_of_week")
        .execute()
    )
    return response.data


@router.post("/bulk")
def upsert_week_plan_bulk(payload: WeekPlanBulkPayload):
    client = get_client()
    rows = []
    for i, day_data in enumerate(payload.days):
        rows.append({
            "week_id": payload.week_id,
            "person_name": payload.person_name,
            "day_of_week": i,
            "data": day_data,
        })
    response = (
        client.table("week_plans")
        .upsert(rows, on_conflict="week_id,person_name,day_of_week")
        .execute()
    )
    return response.data


@router.delete("/")
def delete_week_plan(week_id: str, person_name: Optional[str] = None):
    client = get_client()
    query = client.table("week_plans").delete().eq("week_id", week_id)
    if person_name:
        query = query.eq("person_name", person_name)
    response = query.execute()
    return {"deleted_count": len(response.data)}
