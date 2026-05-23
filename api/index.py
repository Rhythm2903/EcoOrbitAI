"""
EcoOrbit AI — Agentic Vision Pipeline
File: api/index.py
"""

import os
import json
import base64
import hashlib
import re
import io
import traceback
from pathlib import Path

import requests
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# ─── Load .env from the api/ directory (where this file lives) ────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="EcoOrbit AI", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constants ────────────────────────────────────────────────────────────────
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TEXT_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-4-scout-17b-16e-instruct",
    "llama-4-maverick-17b-128e-instruct",
]
OWM_API_URL = "https://api.openweathermap.org/data/2.5/weather"

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/tiff", "image/gif"}
MAX_FILE_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_VISION_KB = 3_500              # Groq base64 cap

# In-memory result cache  { sha256_hex -> report_dict }
_cache: dict = {}


# ─── Utilities ────────────────────────────────────────────────────────────────

def _keys() -> str:
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        raise HTTPException(500, "GROQ_API_KEY missing from api/.env")
    return key


def _parse_json(raw: str) -> dict:
    """Strip markdown fences then parse JSON. Raises ValueError on failure."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    # If model wrapped output in outer text, grab the first {...} block
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        return json.loads(match.group())
    raise ValueError(f"No JSON object found in: {cleaned[:200]}")


def _groq_text(key: str, system: str, user: str, temp: float = 0.4) -> str:
    resp = requests.post(
        GROQ_API_URL,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "model": GROQ_TEXT_MODEL,
            "temperature": temp,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
        },
        timeout=30,
    )
    if resp.status_code != 200:
        raise HTTPException(502, f"Groq text error {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"].strip()


def _resize(image_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    """Shrink image to stay under Groq's base64 size cap."""
    if len(image_bytes) <= MAX_VISION_KB * 1024:
        return image_bytes, mime_type
    if not PIL_AVAILABLE:
        print("[RESIZE] Pillow unavailable — sending original")
        return image_bytes, mime_type

    img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    quality, scale = 85, 1.0
    while True:
        w, h = int(img.width * scale), int(img.height * scale)
        buf = io.BytesIO()
        img.resize((w, h), PILImage.LANCZOS).save(buf, format="JPEG", quality=quality)
        data = buf.getvalue()
        if len(data) <= MAX_VISION_KB * 1024 or quality < 40:
            print(f"[RESIZE] → {len(data)//1024} KB (scale={scale:.2f}, q={quality})")
            return data, "image/jpeg"
        quality = max(40, quality - 10)
        scale = max(0.1, scale - 0.1)


# ─── Live Weather ─────────────────────────────────────────────────────────────

def fetch_live_weather(lat: float, lon: float) -> dict | None:
    owm_key = os.environ.get("OWM_API_KEY", "").strip()
    if not owm_key:
        print("[WEATHER] OWM_API_KEY not set — skipping")
        return None
    try:
        resp = requests.get(
            OWM_API_URL,
            params={"lat": lat, "lon": lon, "appid": owm_key, "units": "metric"},
            timeout=8,
        )
        if resp.status_code != 200:
            print(f"[WEATHER] OWM {resp.status_code}: {resp.text[:200]}")
            return None
        d = resp.json()
        return {
            "location":          d.get("name", ""),
            "condition":         d["weather"][0]["description"].title(),
            "temperatureC":      round(d["main"]["temp"], 1),
            "feelsLikeC":        round(d["main"]["feels_like"], 1),
            "tempMinC":          round(d["main"]["temp_min"], 1),
            "tempMaxC":          round(d["main"]["temp_max"], 1),
            "humidity":          d["main"]["humidity"],
            "pressureHpa":       d["main"]["pressure"],
            "windSpeedMs":       d["wind"]["speed"],
            "cloudCoverPct":     d["clouds"]["all"],
            "visibilityM":       d.get("visibility"),
            "rainMmLastHour":    d.get("rain", {}).get("1h", 0),
        }
    except Exception as exc:
        print(f"[WEATHER] Fetch failed: {exc}")
        return None


def _weather_context_block(lw: dict) -> str:
    vis = f"{lw['visibilityM']} m" if lw["visibilityM"] else "N/A"
    return f"""
=== REAL-TIME WEATHER (OpenWeatherMap) — treat as ground truth ===
Location      : {lw['location']}
Condition     : {lw['condition']}
Temperature   : {lw['temperatureC']}°C  (feels like {lw['feelsLikeC']}°C)
Range today   : {lw['tempMinC']}°C – {lw['tempMaxC']}°C
Humidity      : {lw['humidity']}%
Pressure      : {lw['pressureHpa']} hPa
Wind speed    : {lw['windSpeedMs']} m/s
Cloud cover   : {lw['cloudCoverPct']}%
Visibility    : {vis}
Rain (last 1h): {lw['rainMmLastHour']} mm

Use ALL the above values verbatim in the weatherPrediction JSON block.
Your weatherSummary must explain how the satellite image visually
corroborates or contrasts with this live data.
=================================================================
"""


# ─── Vision Prompt ────────────────────────────────────────────────────────────

VISION_SCHEMA = """{
  "metrics": {
    "classification": "primary land-cover label",
    "confidence": "e.g. 91.3%",
    "vegetationIndex": "descriptive NDVI range statement",
    "estimatedCarbonLoss": "carbon baseline description"
  },
  "weatherPrediction": {
    "condition": "sky/weather condition",
    "temperatureRange": "e.g. 38–42°C",
    "humidity": "e.g. 18%",
    "precipitationLikelihood": "e.g. Low (5%)",
    "windIndicator": "e.g. Light — minimal cloud streaking",
    "visibility": "e.g. Good — clear atmosphere",
    "weatherSummary": "2-3 sentences linking visual cues to weather state"
  },
  "llmAnalysis": {
    "summary": "2-3 sentence executive summary",
    "climateImpact": "paragraph on carbon, thermal, and ecological impact",
    "recommendations": ["directive 1", "directive 2", "directive 3"]
  }
}"""

BASE_VISION_PROMPT = f"""You are an elite remote sensing scientist and climate analyst.
Examine the satellite image carefully.

Tasks:
1. Identify the primary land-cover classification.
2. Populate the weatherPrediction block — if real-time weather data is provided above,
   use those exact values; otherwise estimate from visual cues only.
3. Write a concise climate impact analysis.

Return ONLY a raw JSON object with NO markdown, NO backticks, matching this schema:
{VISION_SCHEMA}"""


# ─── Agent 1 — Mission Planner ────────────────────────────────────────────────

def agent_mission_planner(key: str, mime: str, kb: float, filename: str) -> dict:
    system = (
        "You are an expert remote sensing mission architect. "
        "Given image metadata, design the optimal analysis strategy. "
        "Respond ONLY with raw JSON — no markdown, no backticks."
    )
    user = f"""Image metadata:
- Filename : {filename}
- MIME     : {mime}
- Size     : {kb:.1f} KB

Return ONLY:
{{
  "likely_biome": "dominant biome/land-cover guess from filename",
  "focus_areas": ["visual feature 1", "feature 2", "feature 3"],
  "strategy_notes": "one sentence analysis approach"
}}"""

    raw = _groq_text(key, system, user, temp=0.3)
    try:
        return _parse_json(raw)
    except Exception:
        return {
            "likely_biome": "Unknown",
            "focus_areas": ["land cover", "vegetation density", "urban structures"],
            "strategy_notes": "General multi-class terrain analysis.",
        }


# ─── Groq Vision Call ─────────────────────────────────────────────────────────

def call_groq_vision(key: str, b64: str, mime: str, prompt: str) -> dict:
    for model_id in GROQ_VISION_MODELS:
        print(f"[VISION] Trying {model_id}")
        try:
            resp = requests.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": model_id,
                    "temperature": 0.25,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "auto"}},
                            {"type": "text", "text": prompt},
                        ],
                    }],
                },
                timeout=90,
            )
        except Exception as exc:
            print(f"[VISION] Request failed for {model_id}: {exc}")
            continue

        if resp.status_code == 200:
            raw = resp.json()["choices"][0]["message"]["content"].strip()
            print(f"[VISION] Raw (first 300): {raw[:300]}")
            try:
                return _parse_json(raw)
            except Exception as exc:
                raise HTTPException(502, f"Vision model returned non-JSON: {raw[:200]}")

        print(f"[VISION] {model_id} → {resp.status_code}: {resp.text[:300]}")
        if resp.status_code in (401, 403):
            raise HTTPException(502, f"Groq auth error: {resp.text[:200]}")

    raise HTTPException(502, "All Groq vision models failed.")


# ─── Agent 2 — Climate Analyst ────────────────────────────────────────────────

def agent_climate_analyst(key: str, vision_out: dict, mission: dict) -> dict:
    system = (
        "You are a senior climate systems analyst specialising in satellite remote sensing. "
        "Enrich raw vision telemetry with risk scoring and anomaly detection. "
        "Respond ONLY with raw JSON — no markdown, no backticks."
    )
    user = f"""Mission plan:
{json.dumps(mission, indent=2)}

Vision telemetry:
{json.dumps(vision_out, indent=2)}

Return ONLY:
{{
  "risk_score": <integer 0-100>,
  "alert_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "anomaly_flags": ["flag 1", "flag 2"],
  "enhanced_recommendations": ["rec 1", "rec 2", "rec 3"],
  "analyst_note": "one sentence key finding"
}}"""

    raw = _groq_text(key, system, user, temp=0.35)
    try:
        return _parse_json(raw)
    except Exception:
        return {
            "risk_score": 50,
            "alert_level": "MEDIUM",
            "anomaly_flags": [],
            "enhanced_recommendations": vision_out.get("llmAnalysis", {}).get("recommendations", []),
            "analyst_note": "Automated enrichment unavailable.",
        }


# ─── Agent 3 — Report Synthesizer ─────────────────────────────────────────────

def agent_report_synthesizer(key: str, vision_out: dict, analyst_out: dict, mission: dict) -> dict:
    system = (
        "You are an elite geospatial intelligence report synthesizer. "
        "Merge upstream data into a single clean frontend-ready JSON report. "
        "Respond ONLY with raw JSON — no markdown, no backticks."
    )
    user = f"""Merge these three sources into the final report schema:

1. Mission Plan:
{json.dumps(mission, indent=2)}

2. Vision Telemetry:
{json.dumps(vision_out, indent=2)}

3. Climate Analyst:
{json.dumps(analyst_out, indent=2)}

Return ONLY this exact schema:
{{
  "metrics": {{
    "classification": "from vision",
    "confidence": "from vision",
    "vegetationIndex": "from vision",
    "estimatedCarbonLoss": "from vision",
    "riskScore": <integer from analyst>,
    "alertLevel": "from analyst"
  }},
  "weatherPrediction": {{
    "condition": "from vision",
    "temperatureRange": "from vision",
    "humidity": "from vision",
    "precipitationLikelihood": "from vision",
    "windIndicator": "from vision",
    "visibility": "from vision",
    "weatherSummary": "from vision"
  }},
  "llmAnalysis": {{
    "summary": "improved summary blending all sources",
    "climateImpact": "enriched impact paragraph",
    "recommendations": ["enhanced rec 1", "enhanced rec 2", "enhanced rec 3"],
    "anomalyFlags": ["flag 1"],
    "analystNote": "from analyst",
    "strategyNote": "from mission plan",
    "likelyBiome": "from mission plan"
  }},
  "pipeline": {{
    "agentsUsed": ["Mission Planner", "Groq Vision", "Climate Analyst", "Report Synthesizer"],
    "model": "llama-4-scout + llama-3.3-70b"
  }}
}}"""

    raw = _groq_text(key, system, user, temp=0.2)
    try:
        return _parse_json(raw)
    except Exception:
        # Graceful degradation
        metrics = vision_out.get("metrics", {})
        metrics["riskScore"]  = analyst_out.get("risk_score", 50)
        metrics["alertLevel"] = analyst_out.get("alert_level", "MEDIUM")
        llm = vision_out.get("llmAnalysis", {})
        llm["anomalyFlags"]        = analyst_out.get("anomaly_flags", [])
        llm["analystNote"]         = analyst_out.get("analyst_note", "")
        llm["strategyNote"]        = mission.get("strategy_notes", "")
        llm["likelyBiome"]         = mission.get("likely_biome", "")
        llm["recommendations"]     = analyst_out.get("enhanced_recommendations", llm.get("recommendations", []))
        return {
            "metrics": metrics,
            "weatherPrediction": vision_out.get("weatherPrediction", {}),
            "llmAnalysis": llm,
            "pipeline": {
                "agentsUsed": ["Mission Planner", "Groq Vision", "Climate Analyst", "Report Synthesizer"],
                "model": "llama-4-scout + llama-3.3-70b",
            },
        }


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api")
def health_check():
    return {"status": "active", "pipeline": "EcoOrbit v2", "agents": 4}


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    lat: float | None = Form(default=None),
    lon: float | None = Form(default=None),
):
    try:
        key = _keys()

        # ── Validate file ────────────────────────────────────────────────────
        mime = file.content_type or "image/jpeg"
        if mime not in ALLOWED_MIME:
            raise HTTPException(400, f"Unsupported type '{mime}'. Use JPEG/PNG/WEBP/TIFF.")

        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_FILE_BYTES:
            raise HTTPException(413, f"File too large ({len(raw_bytes)//1024} KB). Max 15 MB.")
        if len(raw_bytes) < 1024:
            raise HTTPException(400, "File appears empty or corrupt.")

        # ── Cache ────────────────────────────────────────────────────────────
        img_hash = hashlib.sha256(raw_bytes).hexdigest()
        if img_hash in _cache:
            print(f"[CACHE HIT] {img_hash[:12]}")
            return {**_cache[img_hash], "cached": True}

        filename = file.filename or "satellite_image"

        # ── Resize → base64 ──────────────────────────────────────────────────
        img_bytes, mime = _resize(raw_bytes, mime)
        b64 = base64.b64encode(img_bytes).decode()
        kb  = len(img_bytes) / 1024

        # ── Live weather ──────────────────────────────────────────────────────
        live_weather = None
        if lat is not None and lon is not None:
            print(f"[WEATHER] Fetching for {lat}, {lon}")
            live_weather = fetch_live_weather(lat, lon)
            if live_weather:
                print(f"[WEATHER] {live_weather['condition']}, {live_weather['temperatureC']}°C")

        # ── Agent 1 — Mission Planner ─────────────────────────────────────────
        print("[AGENT 1] Mission Planner…")
        mission = agent_mission_planner(key, mime, kb, filename)
        print(f"[AGENT 1] Biome: {mission.get('likely_biome')}")

        # ── Groq Vision ───────────────────────────────────────────────────────
        print("[VISION] Running…")
        vision_prompt = BASE_VISION_PROMPT
        if live_weather:
            vision_prompt = _weather_context_block(live_weather) + "\n" + vision_prompt

        vision_out = call_groq_vision(key, b64, mime, vision_prompt)
        print(f"[VISION] Class: {vision_out.get('metrics', {}).get('classification')}")

        # ── Agent 2 — Climate Analyst ─────────────────────────────────────────
        print("[AGENT 2] Climate Analyst…")
        analyst_out = agent_climate_analyst(key, vision_out, mission)
        print(f"[AGENT 2] Risk: {analyst_out.get('risk_score')} | {analyst_out.get('alert_level')}")

        # ── Agent 3 — Report Synthesizer ──────────────────────────────────────
        print("[AGENT 3] Synthesizing report…")
        report = agent_report_synthesizer(key, vision_out, analyst_out, mission)
        report["cached"] = False
        if live_weather:
            report["liveWeather"] = live_weather

        _cache[img_hash] = report
        print(f"[CACHE] Stored {img_hash[:12]}")
        return report

    except HTTPException:
        raise
    except Exception as exc:
        print("\n" + "=" * 50)
        traceback.print_exc()
        print("=" * 50 + "\n")
        raise HTTPException(500, str(exc))