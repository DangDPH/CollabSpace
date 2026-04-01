# app/models/database.py
from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator
from typing import Annotated, Optional

# ==========================================
# 1. MONGODB ID HELPER (Pydantic V2 Style)
# ==========================================
# This tells Pydantic: "Whenever you see an ObjectId from MongoDB, 
# run the str() function on it to turn it into a normal string before using it."
PyObjectId = Annotated[str, BeforeValidator(str)]

# ==========================================
# 2. BASE DOCUMENT DEFINITION
# ==========================================
class MongoBaseModel(BaseModel):
    """
    Any schema that represents data coming directly OUT of MongoDB 
    should inherit from this class.
    """
    # Map the standard Python 'id' to MongoDB's internal '_id'
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    # In Pydantic V2, 'class Config' is replaced by 'model_config'
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )