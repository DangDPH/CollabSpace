# app/services/board.py
from app.core.database import get_mongo_db
from app.schemas.board import BoardCreate
from bson import ObjectId

async def create_board(board: BoardCreate):
    """Creates a board AND an empty canvas for it to live on."""
    db = get_mongo_db()
    
    # 1. Convert the Pydantic model into a normal Python dictionary
    board_dict = board.model_dump()
    
    # 2. Insert into the 'boards' collection
    result = await db.boards.insert_one(board_dict)
    
    # MongoDB automatically generates an '_id'. We convert it to a string.
    board_id = str(result.inserted_id)
    
    # 3. Create a blank canvas document linked to this new board_id
    await db.canvas_data.insert_one({
        "board_id": board_id, 
        "elements": [],     # Empty list because nothing is drawn yet
        "version": 1        # Start at version 1
    })
    
    # IMPORTANT: MongoDB mutates board_dict and injects _id as ObjectId.
    # We must remove it before returning, then add our string version.
    board_dict.pop("_id", None)
    
    # Return the data to the user so they know it succeeded
    return {"id": board_id, **board_dict}


async def list_boards(owner_id: str):
    """Fetches all boards belonging to a specific user."""
    db = get_mongo_db()
    
    cursor = db.boards.find({"owner_id": owner_id})
    boards = []
    async for doc in cursor:
        # Convert ObjectId _id to string and rename to id
        board = {
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "owner_id": doc.get("owner_id", ""),
            "color": doc.get("color", "#74C0FC"),
        }
        boards.append(board)
    
    return boards


async def delete_board(board_id: str):
    """Deletes a board and its associated canvas data."""
    db = get_mongo_db()
    
    try:
        obj_id = ObjectId(board_id)
    except Exception:
        return False
    
    result = await db.boards.delete_one({"_id": obj_id})
    # Also clean up the canvas data
    await db.canvas_data.delete_many({"board_id": board_id})
    
    return result.deleted_count > 0


async def get_canvas(board_id: str):
    """Fetches all the drawings for a specific board."""
    db = get_mongo_db()
    
    # Search the canvas_data collection for a matching board_id
    canvas = await db.canvas_data.find_one({"board_id": board_id})
    
    # MongoDB ObjectIds break standard JSON, so we must convert the _id to a string
    if canvas:
        canvas["_id"] = str(canvas["_id"])
        
    return canvas


async def save_canvas_elements(board_id: str, elements: list):
    """Saves the drawing shapes back to the database."""
    db = get_mongo_db()
    result = await db.canvas_data.update_one(
        {"board_id": board_id},
        {"$set": {"elements": elements}}
    )
    return result.modified_count > 0

async def get_document(board_id: str):
    """Fetches the HTML document string for a board."""
    db = get_mongo_db()
    try:
        obj_id = ObjectId(board_id)
    except Exception:
        return ""
    board = await db.boards.find_one({"_id": obj_id})
    if board and "document_html" in board:
        return board["document_html"]
    return ""

async def save_document(board_id: str, html: str):
    """Saves the HTML document string to the board document."""
    db = get_mongo_db()
    try:
        obj_id = ObjectId(board_id)
    except Exception:
        return False
    result = await db.boards.update_one(
        {"_id": obj_id},
        {"$set": {"document_html": html}}
    )
    return result.modified_count > 0

async def get_board_metadata(board_id: str):
    """Fetches board metadata (name, color)."""
    db = get_mongo_db()
    try:
        obj_id = ObjectId(board_id)
    except Exception:
        return None
    doc = await db.boards.find_one({"_id": obj_id})
    if doc:
        return {
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "owner_id": doc.get("owner_id", ""),
            "color": doc.get("color", "#74C0FC"),
        }
    return None

