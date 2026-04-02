from pydantic import BaseModel, Field, ConfigDict
from pydantic.functional_validators import BeforeValidator
from typing import Annotated, Optional, List, Dict, Any
from datetime import datetime

# ==========================================
# 1. MONGODB ID HELPER (Pydantic V2 Style)
# ==========================================
# Converts incoming Mongo ObjectIds to strings automatically
PyObjectId = Annotated[str, BeforeValidator(str)]

# ==========================================
# 2. BASE DOCUMENT DEFINITION
# ==========================================
class MongoBaseModel(BaseModel):
    """
    Any schema that represents data coming directly OUT of MongoDB 
    should inherit from this class.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

# ==========================================
# INPUT SCHEMAS (Data coming FROM the frontend)
# ==========================================

class BoardCreate(BaseModel):
    """Expected data when a user creates a new board."""
    name: str = Field(..., example="Team Design Board")
    owner_id: str = ""
    color: Optional[str] = Field(default="#74C0FC", example="#74C0FC")

class CanvasElement(BaseModel):
    """Expected data when a user draws a single shape."""
    id: str
    type: str = Field(..., example="rectangle")
    x: float
    y: float
    properties: Dict[str, Any] = {}

class CanvasSaveRequest(BaseModel):
    """Payload to save the entire canvas."""
    elements: List[Dict[str, Any]] = Field(..., description="Array of drawing objects")

class DocumentSaveRequest(BaseModel):
    """Payload to save the rich text document."""
    html: str = Field(..., description="The HTML content of the document")

# ==========================================
# OUTPUT SCHEMAS (Data going TO the frontend)
# ==========================================

class BoardResponse(MongoBaseModel):
    """How we format the board data before sending it to the frontend."""
    name: str
    owner_id: str
    color: Optional[str] = None
    
class CanvasDataResponse(MongoBaseModel):
    """How we format the full canvas when a user loads a board."""
    board_id: str
    elements: List[CanvasElement]
    version: int
