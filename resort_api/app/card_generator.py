import io
from PIL import Image, ImageDraw, ImageFont
from .models import Resort

from typing import Optional
from datetime import date

def generate_resort_card(resort: Resort, user_name: Optional[str] = None, activity_date: Optional[date] = None) -> bytes:
    """Generates a shareable image card for a given resort, with optional user info."""
    # For simplicity, we'll create a new blank image here.
    # In a real app, you would load a beautiful template image.
    width, height = 800, 450
    background_color = (18, 28, 48) # A dark blue
    img = Image.new('RGB', (width, height), color = background_color)
    d = ImageDraw.Draw(img)

    # Load fonts (this assumes fonts are available in the execution environment)
    try:
        title_font = ImageFont.truetype("arial.ttf", 48)
        text_font = ImageFont.truetype("arial.ttf", 24)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except IOError:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # --- Content Drawing ---
    text_color = (255, 255, 255)

    # Resort Name
    resort_name = resort.names.en or resort.names.ja or "Unknown Resort"
    d.text((40, 40), resort_name, font=title_font, fill=text_color)

    # Tagline
    if resort.description and resort.description.tagline:
        d.text((45, 100), resort.description.tagline, font=text_font, fill=(200, 200, 200))

    # Stats
    if resort.snow_stats:
        longest_run = f"Longest Run: {resort.snow_stats.longest_run}m" if resort.snow_stats.longest_run else ""
        courses = f"Courses: {resort.snow_stats.courses_total}" if resort.snow_stats.courses_total else ""
        d.text((40, 180), longest_run, font=text_font, fill=text_color)
        d.text((40, 220), courses, font=text_font, fill=text_color)

    # --- Personalization --- 
    if user_name and activity_date:
        personalization_text = f"{user_name} was here on {activity_date.strftime('%Y-%m-%d')}"
        # Position it at the bottom right
        text_width = d.textlength(personalization_text, font=small_font)
        d.text((width - text_width - 40, height - 50), personalization_text, font=small_font, fill=(220, 220, 220))

    # Convert image to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    return img_byte_arr
