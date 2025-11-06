"""
Google Imagen 3 Image Generation Service.

Generates beautiful share cards for:
1. Course completion
2. Achievement unlocks
3. Resort progress milestones
"""
import os
import base64
from typing import Optional, Dict, Any
from datetime import datetime
import httpx


class ImagenService:
    """Service for generating share card images using Google Imagen 3."""

    def __init__(self):
        """Initialize Imagen service with API key from environment."""
        self.api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_GEMINI_API_KEY environment variable not set")

        self.model = "imagen-3.0-generate-001"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_course_completion_card(
        self,
        resort_name_zh: str,
        resort_name_en: str,
        course_name: str,
        difficulty: str,
        date_completed: str,
        user_stats: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """
        Generate share card for completing a course.

        Args:
            resort_name_zh: Resort name in Chinese
            resort_name_en: Resort name in English
            course_name: Course/slope name
            difficulty: beginner/intermediate/advanced
            date_completed: Completion date string
            user_stats: Optional dict with {total_courses, total_resorts}

        Returns:
            Image bytes (PNG format)
        """
        # Map difficulty to Chinese and emoji
        difficulty_map = {
            'beginner': ('初級', '🟢'),
            'intermediate': ('中級', '🔵'),
            'advanced': ('高級', '⚫')
        }
        diff_zh, diff_emoji = difficulty_map.get(difficulty.lower(), ('中級', '🔵'))

        # Build stats text
        stats_text = ""
        if user_stats:
            stats_text = f"已完成 {user_stats.get('total_courses', 0)} 條雪道 · 征服 {user_stats.get('total_resorts', 0)} 個雪場"

        prompt = f"""Create a modern, minimalist ski resort achievement card with the following design:

**Layout:**
- Elegant gradient background (sky blue to white, suggesting snow and sky)
- Top section: Mountain silhouette or abstract ski trail pattern in light gray
- Center: Large celebration emoji 🎉 or 🏂
- Main text area with clean typography

**Text content (use these EXACT texts):**
Title (large, bold): "完成雪道！"
Resort: "{resort_name_zh}"
English: "{resort_name_en}"
Course: "{course_name}" {diff_emoji} {diff_zh}
Date: "{date_completed}"
{stats_text if stats_text else ""}
Footer: "分享你的滑雪冒險" with small QR code placeholder

**Style requirements:**
- Clean, modern design
- Professional skiing/snowboarding aesthetic
- Suitable for Instagram/Facebook sharing
- Aspect ratio: 1:1 (square)
- High contrast text for readability
- Use ski-themed accents (snowflakes, mountains)
- Color palette: Blues, whites, with accent colors

**Mood:** Celebratory, energetic, adventurous
**Quality:** High resolution, sharp text, professional finish"""

        return await self._generate_image(prompt)

    async def generate_achievement_card(
        self,
        achievement_name_zh: str,
        achievement_name_en: str,
        achievement_icon: str,
        points: int,
        description: Optional[str] = None
    ) -> bytes:
        """
        Generate share card for unlocking an achievement.

        Args:
            achievement_name_zh: Achievement name in Chinese
            achievement_name_en: Achievement name in English
            achievement_icon: Emoji icon for achievement
            points: Points earned
            description: Optional achievement description

        Returns:
            Image bytes (PNG format)
        """
        desc_text = f'"{description}"' if description else ""

        prompt = f"""Create a prestigious achievement unlock card with the following design:

**Layout:**
- Luxurious gradient background (gold to deep purple, suggesting prestige)
- Radial glow effect from center
- Top: Decorative border or frame
- Center: Large achievement icon {achievement_icon} with glow effect
- Bottom: Achievement details

**Text content (use these EXACT texts):**
Top banner: "🏆 解鎖成就！🏆"
Achievement icon (huge): {achievement_icon}
Title (bold, prominent): "{achievement_name_zh}"
Subtitle: "{achievement_name_en}"
Points (large, gold color): "+{points} 積分"
{desc_text}
Footer: "繼續征服更多雪場！"

**Style requirements:**
- Luxurious, premium feel
- Badge/medal aesthetic
- Celebration atmosphere
- Aspect ratio: 1:1 (square)
- High contrast with metallic accents
- Trophy/award theme

**Mood:** Proud, accomplished, prestigious
**Quality:** High resolution, premium finish, eye-catching"""

        return await self._generate_image(prompt)

    async def generate_progress_milestone_card(
        self,
        resort_name_zh: str,
        resort_name_en: str,
        completion_percentage: int,
        completed_courses: int,
        total_courses: int,
        milestone_type: str = "50%"  # "25%", "50%", "75%", "100%"
    ) -> bytes:
        """
        Generate share card for resort progress milestone.

        Args:
            resort_name_zh: Resort name in Chinese
            resort_name_en: Resort name in English
            completion_percentage: Percentage completed (0-100)
            completed_courses: Number of completed courses
            total_courses: Total number of courses
            milestone_type: Type of milestone achieved

        Returns:
            Image bytes (PNG format)
        """
        # Milestone emojis
        milestone_map = {
            "25%": "🌟",
            "50%": "⭐",
            "75%": "✨",
            "100%": "🏆"
        }
        milestone_emoji = milestone_map.get(milestone_type, "⭐")

        prompt = f"""Create a progress milestone celebration card with the following design:

**Layout:**
- Dynamic gradient background (teal to blue, suggesting progression)
- Top: Resort landmark or mountain peak silhouette
- Center: Large circular progress ring showing {completion_percentage}%
- Bottom: Stats and milestone info

**Text content (use these EXACT texts):**
Top: {milestone_emoji} "里程碑達成！" {milestone_emoji}
Resort: "{resort_name_zh}"
English: "{resort_name_en}"
Progress (huge, center): "{completion_percentage}%"
Stats: "{completed_courses}/{total_courses} 條雪道"
Milestone: "完成度達到 {milestone_type}"
Footer: "加油！繼續探索更多雪道"

**Style requirements:**
- Progress/achievement theme
- Circular progress indicator (filled {completion_percentage}%)
- Modern, motivational design
- Aspect ratio: 1:1 (square)
- Vibrant colors suggesting progress
- Data visualization aesthetics

**Mood:** Motivational, progressive, energetic
**Quality:** High resolution, clear data visualization, inspiring"""

        return await self._generate_image(prompt)

    async def _generate_image(self, prompt: str) -> bytes:
        """
        Internal method to call Imagen 3 API.

        Args:
            prompt: Text prompt for image generation

        Returns:
            Image bytes

        Raises:
            Exception: If API call fails
        """
        url = f"{self.base_url}/{self.model}:generateImages"

        headers = {
            "Content-Type": "application/json",
        }

        payload = {
            "prompt": prompt,
            "config": {
                "number_of_images": 1,
                "aspect_ratio": "1:1",  # Square format for social media
                "safety_filter_level": "block_only_high",
                "person_generation": "allow_adult"
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers=headers,
                params={"key": self.api_key}
            )

            if response.status_code != 200:
                raise Exception(f"Imagen API error: {response.status_code} - {response.text}")

            result = response.json()

            # Extract image from response
            if "generated_images" in result and len(result["generated_images"]) > 0:
                # Image is returned as base64
                image_data = result["generated_images"][0]["image"]["image_bytes"]
                return base64.b64decode(image_data)
            else:
                raise Exception("No image generated in response")


# Global instance (will be initialized in API startup)
imagen_service: Optional[ImagenService] = None


def get_imagen_service() -> ImagenService:
    """Get the global Imagen service instance."""
    global imagen_service
    if imagen_service is None:
        imagen_service = ImagenService()
    return imagen_service
