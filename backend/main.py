from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import re
import json
import requests
import os

from pydantic import BaseModel
from typing import Any, Dict

from dotenv import load_dotenv
from anthropic import Anthropic

from database import create_tables, get_connection
from services.ocr import (
    run_ocr,
    extract_ingredients,
    extract_allergens,
    extract_additives,
)

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

app = FastAPI(title="Food Label OCR Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()


@app.get("/")
def root():
    return {"message": "Food Label OCR backend is running."}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/label-scan")
def label_scan_info():
    return {"message": "Use POST /label-scan with multipart/form-data key='image'."}


# ----------------------------
# AUTH / PROFILE MODELS
# ----------------------------
class AuthRequest(BaseModel):
    username: str
    password: str


class ProfilePayload(BaseModel):
    user_id: int
    language: str = "en"
    strictness: str = "moderate"
    conditions: list[str] = []
    preferences: list[str] = []
    allergies: list[dict] = []

class HistorySavePayload(BaseModel):
    user_id: int
    product_key: str
    mode: str = "barcode"
    product_name: str = ""
    barcode: str = ""
    image_url: str = ""
    nutri_grade: str = ""
    ingredients: list[str] = []
    allergens: list[str] = []
    additives: list[str] = []
    warnings: list[str] = []
    recommendations: list[dict] = []
    raw_text: str = ""


class HistoryItemPayload(BaseModel):
    id: int
    user_id: int
    product_key: str
    mode: str
    product_name: str
    barcode: str
    image_url: str
    nutri_grade: str
    ingredients: list[str]
    allergens: list[str]
    additives: list[str]
    warnings: list[str]
    recommendations: list[dict]
    raw_text: str
    scan_count: int
    created_at: str
    updated_at: str
# ----------------------------
# AUTH ROUTES
# ----------------------------
@app.post("/signup")
def signup(req: AuthRequest):
    conn = None
    try:
        username = (req.username or "").strip().lower()
        password = (req.password or "").strip()

        if not username or not password:
            return {"ok": False, "error": "Username and password are required."}

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, password),
        )
        user_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO profiles (user_id, language, strictness, conditions, preferences, allergies)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                "en",
                "moderate",
                json.dumps([]),
                json.dumps([]),
                json.dumps([]),
            ),
        )

        conn.commit()

        return {
            "ok": True,
            "message": "Signup successful.",
            "user_id": user_id,
            "username": username,
        }

    except Exception as e:
        if conn:
            conn.rollback()
        return {"ok": False, "error": str(e)}

    finally:
        if conn:
            conn.close()


@app.post("/login")
def login(req: AuthRequest):
    conn = None
    try:
        username = (req.username or "").strip().lower()
        password = (req.password or "").strip()

        if not username or not password:
            return {"ok": False, "error": "Username and password are required."}

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, username FROM users WHERE username = ? AND password = ?",
            (username, password),
        )
        row = cursor.fetchone()

        if not row:
            return {"ok": False, "error": "Invalid username or password."}

        return {
            "ok": True,
            "message": "Login successful.",
            "user_id": row["id"],
            "username": row["username"],
        }

    except Exception as e:
        return {"ok": False, "error": str(e)}

    finally:
        if conn:
            conn.close()


@app.get("/profile/{user_id}")
def get_profile(user_id: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

        if not row:
            return {"ok": False, "error": "Profile not found."}

        return {
            "ok": True,
            "profile": {
                "language": row["language"] or "en",
                "strictness": row["strictness"] or "moderate",
                "conditions": json.loads(row["conditions"] or "[]"),
                "preferences": json.loads(row["preferences"] or "[]"),
                "allergies": json.loads(row["allergies"] or "[]"),
            },
        }

    except Exception as e:
        return {"ok": False, "error": str(e)}

    finally:
        if conn:
            conn.close()


@app.post("/profile/save")
def save_profile(payload: ProfilePayload):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE profiles
            SET language = ?, strictness = ?, conditions = ?, preferences = ?, allergies = ?
            WHERE user_id = ?
            """,
            (
                payload.language,
                payload.strictness,
                json.dumps(payload.conditions),
                json.dumps(payload.preferences),
                json.dumps(payload.allergies),
                payload.user_id,
            ),
        )

        conn.commit()
        return {"ok": True, "message": "Profile saved successfully."}

    except Exception as e:
        if conn:
            conn.rollback()
        return {"ok": False, "error": str(e)}

    finally:
        if conn:
            conn.close()


@app.get("/history/{user_id}")
def get_history(user_id: int):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT * FROM scan_history
            WHERE user_id = ?
            ORDER BY updated_at DESC, id DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()

        items = []
        for row in rows:
            items.append({
                "id": row["id"],
                "user_id": row["user_id"],
                "product_key": row["product_key"],
                "mode": row["mode"] or "barcode",
                "product_name": row["product_name"] or "",
                "barcode": row["barcode"] or "",
                "image_url": row["image_url"] or "",
                "nutri_grade": row["nutri_grade"] or "",
                "ingredients": json.loads(row["ingredients"] or "[]"),
                "allergens": json.loads(row["allergens"] or "[]"),
                "additives": json.loads(row["additives"] or "[]"),
                "warnings": json.loads(row["warnings"] or "[]"),
                "recommendations": json.loads(row["recommendations"] or "[]"),
                "raw_text": row["raw_text"] or "",
                "scan_count": row["scan_count"] or 1,
                "created_at": row["created_at"] or "",
                "updated_at": row["updated_at"] or "",
            })

        return {"ok": True, "items": items}

    except Exception as e:
        return {"ok": False, "error": str(e)}

    finally:
        if conn:
            conn.close()
# ----------------------------
# OPEN FOOD FACTS MATCHING
# ----------------------------
def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def extract_search_query(raw_text: str) -> str:
    text = normalize_spaces(raw_text)

    if not text:
        return ""

    text = re.split(
        r"\bingredients?\b|\bnutrition\b|\ballergen\b|\bcontains\b",
        text,
        flags=re.I,
    )[0].strip()

    text = text[:80].strip()
    return text


def score_product_match(query: str, product: dict) -> int:
    q = normalize_spaces(query).lower()
    name = normalize_spaces(product.get("product_name", "")).lower()
    brand = normalize_spaces(product.get("brands", "")).lower()

    score = 0
    if not q:
        return score

    for token in q.split():
        if len(token) < 3:
            continue
        if token in name:
            score += 3
        if token in brand:
            score += 2

    if q and q in name:
        score += 5

    return score


def search_openfoodfacts(query: str):
    if not query:
        return None

    try:
        url = "https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            "search_terms": query,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": 8,
        }

        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()

        products = data.get("products", []) or []
        if not products:
            return None

        best = None
        best_score = -1

        for p in products:
            s = score_product_match(query, p)
            if s > best_score:
                best_score = s
                best = p

        if not best or best_score <= 0:
            return None

        return {
            "product_name": best.get("product_name") or "",
            "brand": best.get("brands") or "",
            "barcode": best.get("code") or "",
            "nutri_grade": (best.get("nutriscore_grade") or "").upper(),
            "image": best.get("image_front_url") or best.get("image_url") or "",
        }

    except Exception:
        return None


@app.post("/history/save")
def save_history(payload: HistorySavePayload):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, scan_count FROM scan_history
            WHERE user_id = ? AND product_key = ?
            """,
            (payload.user_id, payload.product_key),
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE scan_history
                SET mode = ?,
                    product_name = ?,
                    barcode = ?,
                    image_url = ?,
                    nutri_grade = ?,
                    ingredients = ?,
                    allergens = ?,
                    additives = ?,
                    warnings = ?,
                    recommendations = ?,
                    raw_text = ?,
                    scan_count = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (
                    payload.mode,
                    payload.product_name,
                    payload.barcode,
                    payload.image_url,
                    payload.nutri_grade,
                    json.dumps(payload.ingredients),
                    json.dumps(payload.allergens),
                    json.dumps(payload.additives),
                    json.dumps(payload.warnings),
                    json.dumps(payload.recommendations),
                    payload.raw_text,
                    int(existing["scan_count"]) + 1,
                    existing["id"],
                ),
            )
            history_id = existing["id"]
        else:
            cursor.execute(
                """
                INSERT INTO scan_history (
                    user_id, product_key, mode, product_name, barcode, image_url,
                    nutri_grade, ingredients, allergens, additives,
                    warnings, recommendations, raw_text
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.user_id,
                    payload.product_key,
                    payload.mode,
                    payload.product_name,
                    payload.barcode,
                    payload.image_url,
                    payload.nutri_grade,
                    json.dumps(payload.ingredients),
                    json.dumps(payload.allergens),
                    json.dumps(payload.additives),
                    json.dumps(payload.warnings),
                    json.dumps(payload.recommendations),
                    payload.raw_text,
                ),
            )
            history_id = cursor.lastrowid

        conn.commit()

        return {
            "ok": True,
            "history_id": history_id,
            "message": "History saved successfully."
        }

    except Exception as e:
        if conn:
            conn.rollback()
        return {"ok": False, "error": str(e)}

    finally:
        if conn:
            conn.close()
# ----------------------------
# LABEL SCAN
# ----------------------------
@app.post("/label-scan")
async def label_scan(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read()
        if not image_bytes:
            return {
                "ok": False,
                "error": "Empty file received.",
                "raw_text": "",
                "ingredients": [],
                "allergens": [],
                "additives": [],
                "matched_product": None,
            }

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        raw_text = run_ocr(img) or ""
        ingredients = extract_ingredients(raw_text) or []
        allergens = extract_allergens(raw_text) or []
        additives = extract_additives(raw_text) or []

        search_query = extract_search_query(raw_text)
        matched_product = search_openfoodfacts(search_query)

        return {
            "ok": True,
            "raw_text": raw_text,
            "ingredients": ingredients,
            "allergens": allergens,
            "additives": additives,
            "matched_product": matched_product,
            "search_query": search_query,
        }

    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "raw_text": "",
            "ingredients": [],
            "allergens": [],
            "additives": [],
            "matched_product": None,
        }


# ----------------------------
# CHAT / CLAUDE
# ----------------------------
class ChatRequest(BaseModel):
    question: str
    context: Dict[str, Any] = {}
    history: list[dict] = []


def safe_list(x):
    return x if isinstance(x, list) else []


def get_profile_for_chat(user_id: int) -> dict:
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

        if not row:
            return {}

        return {
            "language": row["language"] or "en",
            "strictness": row["strictness"] or "moderate",
            "conditions": json.loads(row["conditions"] or "[]"),
            "preferences": json.loads(row["preferences"] or "[]"),
            "allergies": json.loads(row["allergies"] or "[]"),
        }

    except Exception:
        return {}

    finally:
        if conn:
            conn.close()


def build_profile_text(profile: dict) -> str:
    if not profile:
        return "No user profile available."

    conditions = profile.get("conditions", []) or []
    preferences = profile.get("preferences", []) or []
    allergies = profile.get("allergies", []) or []
    strictness = profile.get("strictness", "moderate")
    language = profile.get("language", "en")

    allergy_lines = []
    for a in allergies:
        if isinstance(a, dict):
            allergy_lines.append(f"{a.get('id', '')} ({a.get('severity', 'moderate')})")
        else:
            allergy_lines.append(str(a))

    return f"""
Language: {language}
Strictness: {strictness}
Conditions: {", ".join(conditions) if conditions else "None"}
Preferences: {", ".join(preferences) if preferences else "None"}
Allergies: {", ".join(allergy_lines) if allergy_lines else "None"}
""".strip()


def build_product_text(ctx: dict) -> str:
    recommendations = ctx.get("recommendations", []) or []
    rec_names = []
    for r in recommendations:
        if isinstance(r, dict):
            name = r.get("name", "")
            reason = r.get("reason", "")
            if name and reason:
                rec_names.append(f"{name} ({reason})")
            elif name:
                rec_names.append(name)
        else:
            rec_names.append(str(r))

    return f"""
Mode: {ctx.get("mode", "unknown")}
Product Name: {ctx.get("productName", "Unknown")}
Barcode: {ctx.get("barcode", "N/A")}
Nutri Grade: {ctx.get("nutriGrade", "N/A")}
Ingredients: {", ".join(ctx.get("ingredients", []) or []) or "Not available"}
Allergens: {", ".join(ctx.get("allergens", []) or []) or "Not available"}
Additives: {", ".join(ctx.get("additives", []) or []) or "Not available"}
Warnings: {", ".join(ctx.get("warnings", []) or []) or "None"}
Recommendations: {", ".join(rec_names) or "None"}
Raw Text: {ctx.get("rawText", "") or "N/A"}
""".strip()


@app.post("/chat")
async def chat_agent(req: ChatRequest):
    try:
        if not anthropic_client:
            return {
                "ok": False,
                "error": "Claude API key is missing. Add ANTHROPIC_API_KEY to backend/.env",
            }

        question = (req.question or "").strip()
        ctx = req.context or {}
        history = req.history or []

        if not question:
            return {"ok": False, "error": "Question is required."}

        user_id = ctx.get("user_id")
        profile = get_profile_for_chat(int(user_id)) if user_id else {}

        system_prompt = """
You are a friendly food safety assistant inside a food label analyzer app.

Rules:
- Answer in simple, warm, user-friendly language.
- Prioritize the user's allergies, health conditions, and dietary preferences.
- If a product may be unsafe, clearly say so and explain why.
- If the product seems acceptable, still mention any caution briefly.
- If safer alternatives are available in recommendations, mention them naturally.
- Use only the provided context.
- Do not invent ingredients, allergens, additives, or medical facts that were not provided.
- If information is missing, say that clearly.
- Keep answers practical and not too long.
"""

        profile_text = build_profile_text(profile)
        product_text = build_product_text(ctx)

        messages = []

        for msg in history[-6:]:
            role = msg.get("role")
            text = msg.get("text") or msg.get("content") or ""
            if role in ["user", "assistant"] and text:
                messages.append({
                    "role": role,
                    "content": text
                })

        user_message = f"""
User Profile:
{profile_text}

Current Product Context:
{product_text}

User Question:
{question}
""".strip()

        messages.append({
            "role": "user",
            "content": user_message
        })

        response = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            system=system_prompt,
            messages=messages,
        )

        answer = ""
        if response and response.content:
            for block in response.content:
                if getattr(block, "type", "") == "text":
                    answer += block.text

        return {
            "ok": True,
            "answer": answer.strip() or "Sorry, I could not generate a response."
        }

    except Exception as e:
        return {"ok": False, "error": str(e)}