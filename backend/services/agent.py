# backend/services/agent.py
import os
from typing import Dict, List

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except Exception:
    GEMINI_AVAILABLE = False


# -----------------------------
# 1️⃣ Gemini setup (optional)
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
USE_GEMINI =False
if USE_GEMINI and GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# -----------------------------
# 2️⃣ Rule-based fallback logic
# -----------------------------
def fallback_health_answer(question: str, context: Dict) -> str:
    """
    Rule-based health explanation (NO AI)
    """

    warnings: List[str] = []

    nutrition = context.get("nutrition", {})
    allergens = context.get("allergens", [])
    profile = context.get("profile", {})

    # Nutrition rules
    try:
        sugar = float(nutrition.get("sugars_g", 0) or 0)
        sat_fat = float(nutrition.get("sat_fat_g", 0) or 0)
        salt = float(nutrition.get("salt_g", 0) or 0)
    except:
        sugar = sat_fat = salt = 0

    if sugar > 22:
        warnings.append("High sugar content")

    if sat_fat > 5:
        warnings.append("High saturated fat")

    if salt > 1.5:
        warnings.append("High salt content")

    # Allergen rules
    user_allergens = profile.get("allergies", [])
    for a in allergens:
        if a.lower() in [x.lower() for x in user_allergens]:
            warnings.append(f"Contains allergen: {a}")

    # Build response
    if not warnings:
        return (
            "Based on the available information and your profile, "
            "this product appears safe for occasional consumption."
        )

    summary = ", ".join(warnings)

    return (
        f"Based on your profile and the product analysis, "
        f"this food may not be suitable for you because: {summary}. "
        "Consider limiting intake or choosing a healthier alternative."
    )


# -----------------------------
# 3️⃣ Main agent entry point
# -----------------------------
def ask_gemini(question: str, context: Dict) -> str:
    """
    Try Gemini → if it fails → fallback logic
    """

    # Try Gemini first
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are a health assistant.

User question:
{question}

Product context:
Ingredients: {context.get("ingredients")}
Allergens: {context.get("allergens")}
Nutrition: {context.get("nutrition")}

Give a clear, simple health answer for a normal user.
"""

            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()

        except Exception as e:
            # Gemini failed → fall back
            pass

    # Fallback (ALWAYS works)
    return fallback_health_answer(question, context)
