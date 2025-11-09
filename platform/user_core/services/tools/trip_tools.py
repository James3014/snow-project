"""
Trip Management Tools
行程管理工具
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import re
from .base import Tool, ToolResult


class CreateMultipleTripsTool(Tool):
    """批次創建行程工具"""

    def __init__(self, trip_service, resort_service):
        self.trip_service = trip_service
        self.resort_service = resort_service

    @property
    def name(self) -> str:
        return "create_multiple_trips"

    @property
    def description(self) -> str:
        return """創建多個滑雪行程。支援批次創建，適合規劃整個雪季。
        範例：創建12月去二世谷5天、1月去白馬3天的行程"""

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "trips": {
                    "type": "array",
                    "description": "行程列表",
                    "items": {
                        "type": "object",
                        "properties": {
                            "resort": {
                                "type": "string",
                                "description": "雪場名稱（中文或英文）"
                            },
                            "start_date": {
                                "type": "string",
                                "description": "開始日期（支援：YYYY-MM-DD、12月15日、下週一）"
                            },
                            "end_date": {
                                "type": "string",
                                "description": "結束日期（可選，預設為開始日期隔天）"
                            },
                            "title": {
                                "type": "string",
                                "description": "行程標題（可選）"
                            },
                            "notes": {
                                "type": "string",
                                "description": "備註（可選）"
                            }
                        },
                        "required": ["resort", "start_date"]
                    }
                }
            },
            "required": ["trips"]
        }

    async def execute(self, user_id: str, **kwargs) -> ToolResult:
        """執行批次創建行程"""
        trips_data = kwargs.get("trips", [])

        created_trips = []
        errors = []

        for trip_input in trips_data:
            try:
                # 1. 解析雪場
                resort_id = await self._resolve_resort(trip_input["resort"])

                # 2. 解析日期
                start_date = self._parse_date(trip_input["start_date"])
                end_date = (
                    self._parse_date(trip_input.get("end_date"))
                    if trip_input.get("end_date")
                    else start_date + timedelta(days=1)
                )

                # 3. 計算雪季 ID
                season_id = self._calculate_season_id(start_date)

                # 4. 創建行程
                trip_data = {
                    "season_id": season_id,
                    "resort_id": resort_id,
                    "title": trip_input.get("title"),
                    "start_date": start_date.strftime("%Y-%m-%d"),
                    "end_date": end_date.strftime("%Y-%m-%d"),
                    "trip_status": "planning",
                    "flexibility": "fixed",
                    "flight_status": "not_planned",
                    "accommodation_status": "not_planned",
                    "visibility": "private",
                    "max_buddies": 1,
                    "notes": trip_input.get("notes", ""),
                }

                trip = await self.trip_service.create_trip(user_id, trip_data)
                created_trips.append(trip)

            except Exception as e:
                errors.append(f"創建 {trip_input.get('resort')} 行程失敗：{str(e)}")

        # 格式化結果
        if created_trips:
            summary = f"成功創建 {len(created_trips)} 個行程：\n"
            for trip in created_trips:
                resort_name = await self._get_resort_name(trip["resort_id"])
                summary += f"✓ {resort_name} ({trip['start_date']} ~ {trip['end_date']})\n"

            if errors:
                summary += f"\n⚠️ {len(errors)} 個失敗：\n" + "\n".join(errors)

            return ToolResult(
                success=True,
                message=summary,
                data={"trips": created_trips, "errors": errors}
            )
        else:
            return ToolResult(
                success=False,
                message="所有行程創建失敗：\n" + "\n".join(errors),
                data={"errors": errors}
            )

    async def _resolve_resort(self, resort_name: str) -> str:
        """解析雪場名稱為 resort_id"""
        # 常見雪場映射表
        RESORT_MAP = {
            "二世谷": "niseko",
            "niseko": "niseko",
            "ニセコ": "niseko",
            "白馬": "hakuba",
            "hakuba": "hakuba",
            "志賀高原": "shiga_kogen",
            "shiga": "shiga_kogen",
            "野澤溫泉": "nozawa_onsen",
            "nozawa": "nozawa_onsen",
            "藏王": "zao",
            "zao": "zao",
            "富良野": "furano",
            "furano": "furano",
        }

        # 先查表
        resort_id = RESORT_MAP.get(resort_name.lower())
        if resort_id:
            return resort_id

        # 調用搜尋 API
        try:
            results = await self.resort_service.search_resorts(resort_name)
            if results and len(results) > 0:
                return results[0]["resort_id"]
        except:
            pass

        # 找不到則直接使用輸入的名稱
        return resort_name.lower().replace(" ", "_")

    def _parse_date(self, date_str: str) -> datetime:
        """解析日期字串"""
        # ISO 格式
        if re.match(r"\d{4}-\d{2}-\d{2}", date_str):
            return datetime.strptime(date_str, "%Y-%m-%d")

        # 中文日期格式：12月15日
        match = re.match(r"(\d{1,2})月(\d{1,2})日?", date_str)
        if match:
            month = int(match.group(1))
            day = int(match.group(2))
            year = datetime.now().year
            # 如果月份已過，則使用明年
            if month < datetime.now().month:
                year += 1
            return datetime(year, month, day)

        # 相對日期
        today = datetime.now()
        if "明天" in date_str:
            return today + timedelta(days=1)
        if "後天" in date_str:
            return today + timedelta(days=2)
        if "下週" in date_str:
            # 簡化處理：下週一
            return today + timedelta(days=7)

        # 無法解析則返回今天
        return today

    def _calculate_season_id(self, date: datetime) -> str:
        """計算雪季 ID"""
        month = date.month
        year = date.year

        # 5-10月 → 下一個雪季
        if 5 <= month <= 10:
            return f"{year}-{year + 1}"
        # 11-12月 → 當前雪季
        elif month >= 11:
            return f"{year}-{year + 1}"
        # 1-4月 → 上一年的雪季
        else:
            return f"{year - 1}-{year}"

    async def _get_resort_name(self, resort_id: str) -> str:
        """獲取雪場中文名稱"""
        try:
            resort = await self.resort_service.get_resort(resort_id)
            return f"{resort['names']['zh']} {resort['names']['en']}"
        except:
            return resort_id


class GetMyTripsTool(Tool):
    """查詢我的行程工具"""

    def __init__(self, trip_service):
        self.trip_service = trip_service

    @property
    def name(self) -> str:
        return "get_my_trips"

    @property
    def description(self) -> str:
        return "查詢用戶的行程列表，可以按雪季、狀態篩選"

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "season": {
                    "type": "string",
                    "description": "雪季（例如：2024-2025，可選）"
                },
                "status": {
                    "type": "string",
                    "enum": ["planning", "confirmed", "completed", "cancelled"],
                    "description": "狀態篩選（可選）"
                },
                "time_range": {
                    "type": "string",
                    "enum": ["upcoming", "past", "all"],
                    "description": "時間範圍（upcoming=未來, past=過去, all=全部）"
                }
            }
        }

    async def execute(self, user_id: str, **kwargs) -> ToolResult:
        """執行查詢行程"""
        try:
            # 獲取所有行程
            trips = await self.trip_service.get_trips(user_id)

            # 篩選
            if kwargs.get("season"):
                trips = [t for t in trips if t.get("season_id") == kwargs["season"]]

            if kwargs.get("status"):
                trips = [t for t in trips if t.get("trip_status") == kwargs["status"]]

            if kwargs.get("time_range"):
                today = datetime.now().date()
                if kwargs["time_range"] == "upcoming":
                    trips = [t for t in trips if datetime.strptime(t["start_date"], "%Y-%m-%d").date() >= today]
                elif kwargs["time_range"] == "past":
                    trips = [t for t in trips if datetime.strptime(t["end_date"], "%Y-%m-%d").date() < today]

            # 格式化結果
            if trips:
                summary = f"找到 {len(trips)} 個行程：\n\n"
                for trip in trips[:10]:  # 最多顯示 10 個
                    summary += f"📅 {trip['start_date']} ~ {trip['end_date']}\n"
                    summary += f"   🏔️ 雪場：{trip['resort_id']}\n"
                    summary += f"   📋 狀態：{trip['trip_status']}\n\n"

                if len(trips) > 10:
                    summary += f"...還有 {len(trips) - 10} 個行程"

                return ToolResult(
                    success=True,
                    message=summary,
                    data={"trips": trips, "total": len(trips)}
                )
            else:
                return ToolResult(
                    success=True,
                    message="沒有找到符合條件的行程",
                    data={"trips": [], "total": 0}
                )

        except Exception as e:
            return ToolResult(
                success=False,
                message=f"查詢行程失敗：{str(e)}",
                data=None
            )
