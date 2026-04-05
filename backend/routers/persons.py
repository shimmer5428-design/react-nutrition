from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from supabase_client import get_client

router = APIRouter()


class PersonPayload(BaseModel):
    name: str
    data: dict[str, Any]


@router.get("/")
def list_persons():
    client = get_client()
    response = client.table("persons").select("*").order("name").execute()
    return response.data


@router.post("/")
def upsert_person(payload: PersonPayload):
    client = get_client()
    response = (
        client.table("persons")
        .upsert({"name": payload.name, "data": payload.data}, on_conflict="name")
        .execute()
    )
    return response.data


@router.delete("/{name}")
def delete_person(name: str):
    client = get_client()
    response = client.table("persons").delete().eq("name", name).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Person '{name}' not found")
    return {"deleted": name}
