from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DIST_DIR = (BASE_DIR / "dist").resolve()
if not DEFAULT_DIST_DIR.exists():
    DEFAULT_DIST_DIR = (BASE_DIR / ".." / "dist").resolve()
DIST_DIR = Path(os.getenv("DIST_DIR", DEFAULT_DIST_DIR)).resolve()
DEFAULT_PACKS_DIR = (BASE_DIR / ".." / "packs").resolve()
PACKS_DIR = Path(os.getenv("PACKS_DIR", DEFAULT_PACKS_DIR)).resolve()

app = Flask(__name__, static_folder=str(DIST_DIR), static_url_path="")
PACKS_DIR.mkdir(parents=True, exist_ok=True)

HANGUL_START = 0xAC00
HANGUL_END = 0xD7A3
CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

COMPLEX_JUNG_DECOMPOSE = {
    'ㅘ': ['ㅗ', 'ㅏ'],
    'ㅙ': ['ㅗ', 'ㅏ', 'ㅣ'],
    'ㅚ': ['ㅗ', 'ㅣ'],
    'ㅝ': ['ㅜ', 'ㅓ'],
    'ㅞ': ['ㅜ', 'ㅓ', 'ㅣ'],
    'ㅟ': ['ㅜ', 'ㅣ'],
    'ㅢ': ['ㅡ', 'ㅣ']
}

COMPLEX_JONG_DECOMPOSE = {
    'ㄳ': ['ㄱ', 'ㅅ'],
    'ㄵ': ['ㄴ', 'ㅈ'],
    'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'],
    'ㄻ': ['ㄹ', 'ㅁ'],
    'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'],
    'ㄾ': ['ㄹ', 'ㅌ'],
    'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'],
    'ㅄ': ['ㅂ', 'ㅅ']
}


def slugify(text: str) -> str:
    cleaned = re.sub(r'[^\w\sㄱ-ㅎㅏ-ㅣ가-힣-]', '', text)
    cleaned = re.sub(r'\s+', '_', cleaned)
    return cleaned.strip('_').lower()


def build_pack_id(level: str, topic: str, sub_topic: str) -> str:
    return f"{slugify(level)}_{slugify(topic)}_{slugify(sub_topic)}"


def disassemble_hangul(text: str) -> list[str]:
    result: list[str] = []
    for char in text:
        code = ord(char)
        if HANGUL_START <= code <= HANGUL_END:
            hangul_code = code - HANGUL_START
            cho_index = hangul_code // 588
            jung_index = (hangul_code % 588) // 28
            jong_index = hangul_code % 28

            result.append(CHO[cho_index])

            jung = JUNG[jung_index]
            if jung in COMPLEX_JUNG_DECOMPOSE:
                result.extend(COMPLEX_JUNG_DECOMPOSE[jung])
            else:
                result.append(jung)

            if jong_index != 0:
                jong = JONG[jong_index]
                if jong in COMPLEX_JONG_DECOMPOSE:
                    result.extend(COMPLEX_JONG_DECOMPOSE[jong])
                else:
                    result.append(jong)
        else:
            result.append(char)
    return result


def build_typing_targets(korean: str) -> list[str]:
    return disassemble_hangul(korean)


def get_public_base_url() -> str:
    public_base = os.getenv("PUBLIC_BASE_URL")
    if public_base:
        return public_base.rstrip("/")

    scheme = request.headers.get("X-Forwarded-Proto", request.scheme)
    host = request.headers.get("X-Forwarded-Host", request.host)
    return f"{scheme}://{host}".rstrip("/")


def process_typing_pack(data: dict) -> dict:
    pack_type = data.get("type")
    level = data.get("level")
    topic = data.get("topic")
    sub_topic = data.get("sub_topic")
    title = data.get("title")
    items = data.get("items", [])

    if not pack_type or not level or not topic or not sub_topic:
        raise ValueError("type, level, topic, sub_topic are required")

    if not isinstance(items, list) or not items:
        raise ValueError("items array is required and must not be empty")

    pack_id = data.get("pack_id") or build_pack_id(level, topic, sub_topic)
    if not title:
        title = f"{level} · {topic} · {sub_topic}"

    processed_items = []
    for item in items:
        korean = item.get("korean")
        english = item.get("english")
        if not korean or not english:
            continue

        processed = dict(item)
        if pack_type != "vocabulary":
            processed.pop("pos", None)

        if "typing_targets" not in processed:
            processed["typing_targets"] = build_typing_targets(korean)
        if "hint" not in processed:
            processed["hint"] = "".join(processed["typing_targets"])

        processed_items.append(processed)

    if not processed_items:
        raise ValueError("items must contain at least one valid entry")

    final_pack = {
        "pack_id": pack_id,
        "type": pack_type,
        "level": level,
        "topic": topic,
        "sub_topic": sub_topic,
        "title": title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "items": processed_items
    }

    pack_path = PACKS_DIR / f"{pack_id}.json"
    pack_path.write_text(json.dumps(final_pack, ensure_ascii=False, indent=2), encoding="utf-8")

    return final_pack


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "typing-game"})


@app.route("/api/packs", methods=["GET"])
def list_packs():
    packs = []
    for pack_file in PACKS_DIR.glob("*.json"):
        try:
            pack_data = json.loads(pack_file.read_text(encoding="utf-8"))
        except Exception:
            continue

        packs.append({
            "pack_id": pack_data.get("pack_id", pack_file.stem),
            "title": pack_data.get("title", "Untitled"),
            "type": pack_data.get("type"),
            "level": pack_data.get("level"),
            "topic": pack_data.get("topic"),
            "sub_topic": pack_data.get("sub_topic"),
            "created_at": pack_data.get("created_at"),
            "item_count": len(pack_data.get("items", []))
        })

    packs.sort(key=lambda p: p["pack_id"])
    return jsonify({"success": True, "packs": packs, "total": len(packs)})


@app.route("/api/packs/<pack_id>", methods=["GET"])
def get_pack(pack_id: str):
    pack_path = PACKS_DIR / f"{pack_id}.json"
    if not pack_path.exists():
        return jsonify({"success": False, "error": "Pack not found"}), 404
    return jsonify(json.loads(pack_path.read_text(encoding="utf-8")))


@app.route("/api/packs/<pack_id>", methods=["DELETE"])
def delete_pack(pack_id: str):
    pack_path = PACKS_DIR / f"{pack_id}.json"
    if not pack_path.exists():
        return jsonify({"success": False, "error": "Pack not found"}), 404
    pack_path.unlink()
    return jsonify({"success": True, "pack_id": pack_id})


@app.route("/api/create-pack", methods=["POST"])
def create_pack():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No JSON data provided"}), 400
    try:
        final_pack = process_typing_pack(data)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    return jsonify({
        "success": True,
        "pack_id": final_pack["pack_id"],
        "items_processed": len(final_pack["items"]),
        "pack_path": f"/packs/{final_pack['pack_id']}.json"
    })


@app.route("/api/create-pack-and-redirect", methods=["POST"])
def create_pack_and_redirect():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No JSON data provided"}), 400
    try:
        final_pack = process_typing_pack(data)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    pack_id = final_pack["pack_id"]
    player_url = f"/players/typing/?pack={pack_id}"
    public_base = get_public_base_url()
    full_url = f"{public_base}{player_url}"

    group_key = f"{slugify(final_pack['level'])}_{slugify(final_pack['topic'])}"
    group_url = f"/players/my-learning/?group={group_key}"
    group_full_url = f"{public_base}{group_url}"

    return jsonify({
        "success": True,
        "pack_id": pack_id,
        "items_processed": len(final_pack["items"]),
        "pack_path": f"/packs/{pack_id}.json",
        "player_url": player_url,
        "full_url": full_url,
        "group_url": group_url,
        "group_full_url": group_full_url
    })


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path: str):
    # Avoid hijacking API routes in the SPA fallback.
    if path.startswith("api/"):
        return jsonify({"error": "not found"}), 404

    target = DIST_DIR / path
    if path and target.exists():
        return send_from_directory(DIST_DIR, path)

    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5003"))
    app.run(host="0.0.0.0", port=port)
