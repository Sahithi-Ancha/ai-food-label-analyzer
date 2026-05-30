import re
from typing import List
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import pytesseract

# Update this path if needed
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

ALLERGEN_KEYWORDS = [
    "milk", "dairy", "whey", "casein", "lactose",
    "soy", "soya", "soybean",
    "egg", "eggs", "albumin",
    "peanut", "peanuts", "groundnut",
    "tree nuts", "almond", "cashew", "walnut", "hazelnut", "pistachio",
    "wheat", "gluten", "barley", "rye", "oats",
    "fish", "shellfish", "shrimp", "prawn", "crab", "lobster",
    "sesame", "mustard", "celery",
    "sulphite", "sulfite",
    "lupin",
]

ADDITIVE_NAME_PATTERNS = {
    "MSG": "E621",
    "MONOSODIUM GLUTAMATE": "E621",
    "CITRIC ACID": "E330",
    "MALIC ACID": "E296",
    "TARTARIC ACID": "E334",
    "ASCORBIC ACID": "E300",
    "SODIUM BENZOATE": "E211",
    "POTASSIUM SORBATE": "E202",
    "ASPARTAME": "E951",
    "TARTRAZINE": "E102",
    "SUNSET YELLOW": "E110",
    "CARAMEL COLOR": "E150",
}

STOP_SECTION_WORDS = [
    "contains",
    "may contain",
    "allergen",
    "allergens",
    "nutrition",
    "nutritional",
    "nutrition facts",
    "storage",
    "warning",
    "warnings",
    "instructions",
    "directions",
    "best before",
    "expiry",
    "manufactured",
    "marketed by",
    "net weight",
    "fssai",
    "customer care",
    "serving size",
]

BAD_PATTERNS = [
    "best before",
    "marketed by",
    "manufactured by",
    "batch number",
    "storage",
    "serving suggestion",
    "nutrition facts",
    "customer care",
    "fssai",
    "lic no",
    "mfg",
    "mrp",
    "net wt",
]


def normalize_spaces(text: str) -> str:
    text = text or ""
    text = text.replace("\r", " ")
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_ocr_text(text: str) -> str:
    text = normalize_spaces(text)

    # common OCR corrections
    text = text.replace("INGRED!ENTS", "INGREDIENTS")
    text = text.replace("INGREDlENTS", "INGREDIENTS")
    text = text.replace("MAYCONTAIN", "MAY CONTAIN")
    text = re.sub(r"\bINGR[EFD]{0,3}IENTS?\b", "INGREDIENTS", text, flags=re.I)
    text = re.sub(r"\bNUTRITI0N\b", "NUTRITION", text, flags=re.I)

    return text.strip()


def preprocess_fast(img: Image.Image) -> List[Image.Image]:
    base = img.convert("L")

    # 2x resize for speed
    base = base.resize((max(1, base.width * 2), max(1, base.height * 2)))

    variants = []

    # Variant 1: autocontrast + sharpen
    v1 = ImageOps.autocontrast(base)
    v1 = ImageEnhance.Contrast(v1).enhance(2.0)
    v1 = v1.filter(ImageFilter.SHARPEN)
    variants.append(v1)

    # Variant 2: thresholded
    v2 = ImageEnhance.Contrast(base).enhance(2.6)
    v2 = v2.filter(ImageFilter.SHARPEN)
    v2 = v2.point(lambda x: 0 if x < 150 else 255, "1").convert("L")
    variants.append(v2)

    return variants


def score_text(text: str) -> int:
    if not text:
        return -999

    score = 0
    upper = text.upper()

    score += len(re.findall(r"[A-Za-z]", text))
    score -= len(re.findall(r"[^A-Za-z0-9\s,.:;()/%\-]", text)) * 2

    if "INGREDIENTS" in upper:
        score += 60
    if "CONTAINS" in upper:
        score += 25
    if "MAY CONTAIN" in upper:
        score += 20

    for kw in ["SUGAR", "SALT", "SODIUM"]:
        if kw in upper:
            score += 10

    return score


def run_ocr(img: Image.Image) -> str:
    variants = preprocess_fast(img)
    candidates = []

    # only 2 OCR passes per image for speed
    for variant in variants:
        for psm in [6, 11]:
            try:
                txt = pytesseract.image_to_string(
                    variant,
                    config=f"--oem 3 --psm {psm}"
                )
                txt = clean_ocr_text(txt)
                if txt:
                    candidates.append(txt)
            except Exception:
                continue

    if not candidates:
        return ""

    best = max(candidates, key=score_text)
    return best.strip()


def clean_item(item: str) -> str:
    item = item.strip(" .,;:-()[]{}")
    item = re.sub(r"\s+", " ", item).strip()
    return item


def looks_like_garbage(item: str) -> bool:
    if not item:
        return True

    letters = len(re.findall(r"[A-Za-z]", item))
    if letters < 2:
        return True

    lowered = item.lower()
    if any(x in lowered for x in BAD_PATTERNS):
        return True

    if len(item) > 80:
        return True

    weird = len(re.findall(r"[^A-Za-z0-9\s()/%\-]", item))
    if weird > 5:
        return True

    return False


def stop_at_next_section(block: str) -> str:
    pattern = r"\b(" + "|".join(re.escape(x) for x in STOP_SECTION_WORDS) + r")\b"
    split = re.split(pattern, block, flags=re.I)
    return split[0].strip() if split else block.strip()


def split_ingredients_block(block: str) -> List[str]:
    block = block.replace(";", ",")
    block = block.replace("|", ",")
    block = block.replace("•", ",")
    block = re.sub(r"\s+", " ", block)

    parts = [clean_item(x) for x in block.split(",")]
    parts = [x for x in parts if len(x) >= 2 and re.search(r"[A-Za-z]", x)]
    return parts


def extract_ingredients(raw_text: str) -> List[str]:
    text = clean_ocr_text(raw_text)
    if not text:
        return []

    patterns = [
        r"\bINGREDIENTS?\b\s*[:\-]?\s*(.+)",
        r"\bINGREDIENT LIST\b\s*[:\-]?\s*(.+)",
        r"\bCOMPOSITION\b\s*[:\-]?\s*(.+)",
    ]

    block = ""
    for pattern in patterns:
        m = re.search(pattern, text, flags=re.I)
        if m:
            block = m.group(1)
            break

    # fallback if OCR partially captured ingredients section
    if not block and "INGREDIENTS" in text.upper():
        idx = text.upper().find("INGREDIENTS")
        block = text[idx: idx + 650]

    if not block:
        return []

    block = stop_at_next_section(block)
    block = block[:650]

    parts = split_ingredients_block(block)

    cleaned = []
    i = 0
    while i < len(parts):
        cur = clean_item(parts[i])

        if looks_like_garbage(cur):
            i += 1
            continue

        if i + 1 < len(parts):
            nxt = clean_item(parts[i + 1])

            if nxt.lower() in ["acid", "oil", "powder", "solids", "syrup"] and len(cur.split()) <= 3:
                merged = f"{cur} {nxt}"
                if not looks_like_garbage(merged):
                    cleaned.append(merged)
                    i += 2
                    continue

        cleaned.append(cur)
        i += 1

    result = []
    seen = set()
    for item in cleaned:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            result.append(item)

    return result[:35]


def normalize_allergen_name(token: str) -> str:
    token = clean_item(token).lower()

    alias_map = {
        "soya": "SOY",
        "soybean": "SOY",
        "eggs": "EGG",
        "peanuts": "PEANUT",
        "groundnut": "PEANUT",
        "dairy": "MILK",
        "whey": "MILK",
        "casein": "MILK",
        "lactose": "MILK",
        "barley": "GLUTEN",
        "rye": "GLUTEN",
        "oats": "GLUTEN",
    }

    return alias_map.get(token, token.upper())


def extract_list_from_section(text: str, start_keyword: str):
    found = set()

    pattern = rf"\b{re.escape(start_keyword)}\b\s*[:\-]?\s*([A-Za-z,\s/()\-]+)"
    m = re.search(pattern, text, flags=re.I)
    if not m:
        return found

    block = m.group(1)
    block = stop_at_next_section(block)

    for token in re.split(r"[,/]", block):
        token = clean_item(token)
        if token:
            found.add(normalize_allergen_name(token))

    return found


def extract_allergens(raw_text: str) -> List[str]:
    text = clean_ocr_text(raw_text)
    if not text:
        return []

    found = set()

    found.update(extract_list_from_section(text, "contains"))
    found.update(extract_list_from_section(text, "may contain"))

    upper_text = text.upper()
    for kw in ALLERGEN_KEYWORDS:
        if kw.upper() in upper_text:
            found.add(normalize_allergen_name(kw))

    result = []
    seen = set()
    for item in found:
        item = item.strip()
        if item and item not in seen:
            seen.add(item)
            result.append(item)

    return result[:20]


def extract_additives(raw_text: str) -> List[str]:
    text = clean_ocr_text(raw_text)
    if not text:
        return []

    found = set()

    # E330 / e-330 / E 330
    for m in re.findall(r"\bE[\s\-]?(\d{3,4})\b", text, flags=re.I):
        found.add(f"E{m}")

    # INS330
    for m in re.findall(r"\bINS[\s\-]?(\d{3,4})\b", text, flags=re.I):
        found.add(f"E{m}")

    # preservative / stabilizer contexts
    additive_contexts = re.findall(
        r"\b(?:flavour enhancers?|flavor enhancers?|acidity regulators?|emulsifiers?|stabilizers?|preservatives?|colors?|colours?|sweeteners?)\b\s*\(([^)]{1,80})\)",
        text,
        flags=re.I,
    )
    for ctx in additive_contexts:
        nums = re.findall(r"\b(\d{3,4})\b", ctx)
        for n in nums:
            found.add(f"E{n}")

    text_upper = text.upper()
    for name, code in ADDITIVE_NAME_PATTERNS.items():
        if name in text_upper:
            found.add(code)

    def sort_key(x: str):
        m = re.search(r"(\d+)", x)
        return int(m.group(1)) if m else 99999

    return sorted(found, key=sort_key)[:25]