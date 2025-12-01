"""
Card generator - creates shareable resort images.
"""
import io
from typing import Optional, Tuple
from datetime import date
from PIL import Image, ImageDraw, ImageFont

from .models import Resort


class FontLoader:
    """Handles font loading with fallback."""
    
    _cache: dict = {}
    
    @classmethod
    def get_font(cls, size: int) -> ImageFont.FreeTypeFont:
        """Get font with caching and fallback."""
        if size not in cls._cache:
            cls._cache[size] = cls._load_font(size)
        return cls._cache[size]
    
    @staticmethod
    def _load_font(size: int) -> ImageFont.FreeTypeFont:
        try:
            return ImageFont.truetype("arial.ttf", size)
        except IOError:
            return ImageFont.load_default()


class CardRenderer:
    """Renders resort share cards."""
    
    WIDTH = 800
    HEIGHT = 450
    BG_COLOR = (18, 28, 48)
    TEXT_COLOR = (255, 255, 255)
    MUTED_COLOR = (200, 200, 200)
    
    def __init__(self, resort: Resort):
        self.resort = resort
        self.img = Image.new('RGB', (self.WIDTH, self.HEIGHT), self.BG_COLOR)
        self.draw = ImageDraw.Draw(self.img)
    
    def render(self, user_name: Optional[str] = None, activity_date: Optional[date] = None) -> bytes:
        """Render the card and return as PNG bytes."""
        self._draw_resort_name()
        self._draw_tagline()
        self._draw_stats()
        if user_name and activity_date:
            self._draw_personalization(user_name, activity_date)
        return self._to_bytes()
    
    def _draw_resort_name(self) -> None:
        name = self.resort.names.en or self.resort.names.ja or "Unknown Resort"
        font = FontLoader.get_font(48)
        self.draw.text((40, 40), name, font=font, fill=self.TEXT_COLOR)
    
    def _draw_tagline(self) -> None:
        if self.resort.description and self.resort.description.tagline:
            font = FontLoader.get_font(24)
            self.draw.text((45, 100), self.resort.description.tagline, font=font, fill=self.MUTED_COLOR)
    
    def _draw_stats(self) -> None:
        if not self.resort.snow_stats:
            return
        font = FontLoader.get_font(24)
        stats = self.resort.snow_stats
        y = 180
        if stats.longest_run:
            self.draw.text((40, y), f"Longest Run: {stats.longest_run}m", font=font, fill=self.TEXT_COLOR)
            y += 40
        if stats.courses_total:
            self.draw.text((40, y), f"Courses: {stats.courses_total}", font=font, fill=self.TEXT_COLOR)
    
    def _draw_personalization(self, user_name: str, activity_date: date) -> None:
        font = FontLoader.get_font(18)
        text = f"{user_name} was here on {activity_date.strftime('%Y-%m-%d')}"
        text_width = self.draw.textlength(text, font=font)
        self.draw.text(
            (self.WIDTH - text_width - 40, self.HEIGHT - 50),
            text, font=font, fill=self.MUTED_COLOR
        )
    
    def _to_bytes(self) -> bytes:
        buffer = io.BytesIO()
        self.img.save(buffer, format='PNG')
        return buffer.getvalue()


def generate_resort_card(
    resort: Resort,
    user_name: Optional[str] = None,
    activity_date: Optional[date] = None
) -> bytes:
    """Generate a shareable image card for a resort."""
    renderer = CardRenderer(resort)
    return renderer.render(user_name, activity_date)
