from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from app.schemas.board import BoardCreate, CanvasSaveRequest, DocumentSaveRequest
from app.services import board as board_service
from app.core.session import require_authenticated

# All routes in this file will automatically start with "/api/v1/boards"
router = APIRouter()

@router.get("/")
async def list_boards(
    current_user=Depends(require_authenticated)
):
    """Lists all boards for the authenticated user."""
    owner_id = str(current_user.id)
    boards = await board_service.list_boards(owner_id)
    return JSONResponse(content=boards)

@router.post("/")
async def create_new_board(
    board: BoardCreate,
    current_user=Depends(require_authenticated)
):
    """Axios POST to /api/v1/boards/ creates a new whiteboard."""
    # Override owner_id from the authenticated user (don't trust frontend)
    board.owner_id = str(current_user.id)
    result = await board_service.create_board(board)
    return JSONResponse(content=result)

@router.get("/{board_id}")
async def get_board_metadata(board_id: str):
    """Fetches the board metadata (name, color)."""
    data = await board_service.get_board_metadata(board_id)
    if not data:
        raise HTTPException(status_code=404, detail="Board not found")
    return data

@router.get("/{board_id}/canvas")
async def get_canvas_data(board_id: str):
    """Fetches the canvas drawings for a board."""
    data = await board_service.get_canvas(board_id)
    if not data:
        return {"elements": []}
    return data

@router.put("/{board_id}/canvas")
async def update_canvas_data(
    board_id: str,
    payload: CanvasSaveRequest,
    current_user=Depends(require_authenticated)
):
    """Saves the canvas drawings for a board."""
    await board_service.save_canvas_elements(board_id, payload.elements)
    return {"detail": "Canvas saved"}

@router.get("/{board_id}/document")
async def get_document_data(board_id: str):
    """Fetches the HTML document for a board."""
    html = await board_service.get_document(board_id)
    return {"html": html}

@router.put("/{board_id}/document")
async def update_document_data(
    board_id: str,
    payload: DocumentSaveRequest,
    current_user=Depends(require_authenticated)
):
    """Saves the HTML document for a board."""
    await board_service.save_document(board_id, payload.html)
    return {"detail": "Document saved"}

@router.delete("/{board_id}")
async def delete_board(
    board_id: str,
    current_user=Depends(require_authenticated)
):
    """Deletes a board and its canvas data."""
    deleted = await board_service.delete_board(board_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Board not found")
    return {"detail": "Board deleted"}

