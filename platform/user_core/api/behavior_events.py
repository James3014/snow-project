from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from services import behavior_event_service, db
from services.casi_skill_analyzer import update_casi_profile_task
from schemas import behavior_event as behavior_event_schema

router = APIRouter()

@router.post("/", response_model=behavior_event_schema.BehaviorEvent)
def create_event_for_user(
    event: behavior_event_schema.BehaviorEventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(db.get_db)
):
    try:
        db_event = behavior_event_service.create_event(db=db, event=event)
        
        # 如果是單板教學的練習完成事件，觸發 CASI 分析
        if (event.source_project == "snowboard-teaching" and 
            event.event_type == "snowboard.practice.completed"):
            background_tasks.add_task(update_casi_profile_task, event.user_id)
        
        return db_event
    except behavior_event_service.BehaviorEventValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("/by-user/{user_id}", response_model=List[behavior_event_schema.BehaviorEvent])
def read_events_for_user(
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    sort_by: Optional[behavior_event_schema.EventSortField] = Query(
        None, description="排序欄位，必填，可選值：occurred_at、recorded_at。"
    ),
    order: behavior_event_schema.SortOrder = Query(
        behavior_event_schema.SortOrder.desc,
        description="排序方向，可選 asc 或 desc，預設 desc。",
    ),
    source_project: Optional[List[str]] = Query(
        None, description="依事件來源專案過濾，可傳入多值。"
    ),
    db: Session = Depends(db.get_db),
):
    if sort_by is None:
        allowed = [field.value for field in behavior_event_schema.EventSortField]
        raise HTTPException(
            status_code=400,
            detail={
                "message": "sort_by 為必填參數。",
                "allowed_values": allowed,
            },
        )

    return behavior_event_service.get_events_by_user(
        db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        order=order,
        source_projects=source_project,
    )
