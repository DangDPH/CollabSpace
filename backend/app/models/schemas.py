# app/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from app.models.database import MongoBaseModel

# ==========================================
# INPUT SCHEMAS (Data coming FROM the frontend)
# ==========================================

class BoardCreate(BaseModel):
    """Expected data when a user creates a new board."""
    name: str = Field(..., example="Team Design Board")
    owner_id: str

class CanvasElement(BaseModel):
    """Expected data when a user draws a single shape."""
    id: str
    type: str = Field(..., example="rectangle")
    x: float
    y: float
    properties: Dict[str, Any] = {}


# ==========================================
# OUTPUT SCHEMAS (Data going TO the frontend)
# ==========================================

class BoardResponse(MongoBaseModel):
    """
    How we format the board data before sending it to the frontend.
    Because it inherits from MongoBaseModel, it automatically handles 
    the MongoDB '_id' conversion for us!
    """
    name: str
    owner_id: str
    
class CanvasDataResponse(MongoBaseModel):
    """How we format the full canvas when a user loads a board."""
    board_id: str
    elements: List[CanvasElement]
    version: int