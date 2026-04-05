from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from supabase_client import get_client

router = APIRouter()


class FoodPayload(BaseModel):
    name: str
    data: dict[str, Any]


@router.get("/")
def list_foods():
    client = get_client()
    response = client.table("custom_foods").select("*").order("name").execute()
    return response.data


@router.post("/")
def upsert_food(payload: FoodPayload):
    client = get_client()
    response = (
        client.table("custom_foods")
        .upsert({"name": payload.name, "data": payload.data}, on_conflict="name")
        .execute()
    )
    return response.data


@router.delete("/{name}")
def delete_food(name: str):
    client = get_client()
    response = client.table("custom_foods").delete().eq("name", name).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Food '{name}' not found")
    return {"deleted": name}
