#!/usr/bin/env python3
"""Validate the finalized batch-one cross-check output."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from consolidate import (
    ALLOWED_CONTINENTAL_TERMS,
    ENTRY_KEYS,
    REF_KEYS,
    SIMPLIFIED_CHARS,
    normalize_publisher,
    valid_ref,
)
import verify_refs

WORK_DIR = Path(__file__).resolve().parent
IDS_PATH = WORK_DIR / "ids.json"
OUTPUT_PATH = WORK_DIR.parent / "batch1_result.json"
CACHE_DIR = WORK_DIR / "fetch_cache"
REQUIRED_CONCERN = "查無可確證之公開權威來源"
FORBIDDEN_PHRASES = (
    "中国大陆",
    "中國大陸",
    "大陆",
    "軟件",
    "信息",
    "網絡",
    "視頻",
)


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle, object_pairs_hook=unique_object)


def expected_ids() -> set[str]:
    payload = load_json(IDS_PATH)
    if not isinstance(payload, list) or len(payload) != 137:
        raise AssertionError("ids.json must contain exactly 137 entries")
    ids: list[str] = []
    for index, item in enumerate(payload):
        if not isinstance(item, dict) or not isinstance(item.get("kp_id"), str):
            raise AssertionError(f"ids.json item {index} has no string kp_id")
        ids.append(item["kp_id"])
    if len(set(ids)) != 137:
        raise AssertionError("ids.json contains duplicate kp_id values")
    return set(ids)


def validate_text(kp_id: str, field: str, text: Any) -> None:
    if not isinstance(text, str):
        raise AssertionError(f"{kp_id}.{field} must be a string")
    simplified = sorted(set(text) & SIMPLIFIED_CHARS)
    if simplified:
        raise AssertionError(
            f"simplified characters remain in {kp_id}.{field}: {''.join(simplified)}"
        )
    if any(phrase in text for phrase in FORBIDDEN_PHRASES):
        raise AssertionError(f"forbidden wording remains in {kp_id}.{field}")
    scrubbed = text
    for term in ALLOWED_CONTINENTAL_TERMS:
        scrubbed = scrubbed.replace(term, "")
    if "大陸" in scrubbed:
        raise AssertionError(f"forbidden 大陸 wording remains in {kp_id}.{field}")


def main() -> int:
    payload = load_json(OUTPUT_PATH)
    if not isinstance(payload, dict) or set(payload) != {"checks"}:
        raise AssertionError("top-level keys must be exactly {'checks'}")
    checks = payload["checks"]
    if not isinstance(checks, dict):
        raise AssertionError("checks must be an object")

    required_ids = expected_ids()
    actual_ids = set(checks)
    if len(checks) != 137 or actual_ids != required_ids:
        missing = sorted(required_ids - actual_ids)
        unknown = sorted(actual_ids - required_ids)
        raise AssertionError(
            f"checks must contain exactly 137 expected IDs; missing={missing}, unknown={unknown}"
        )

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    failures: list[dict[str, str]] = []
    verified_kps = 0
    unresolved_kps = 0
    total_urls = 0

    for kp_id, entry in checks.items():
        if not isinstance(entry, dict) or set(entry) != ENTRY_KEYS:
            raise AssertionError(
                f"{kp_id} keys must be exactly claim, refs, concern"
            )
        validate_text(kp_id, "claim", entry["claim"])
        validate_text(kp_id, "concern", entry["concern"])

        refs = entry["refs"]
        if not isinstance(refs, list):
            raise AssertionError(f"{kp_id}.refs must be an array")
        if not refs:
            unresolved_kps += 1
            if REQUIRED_CONCERN not in entry["concern"]:
                raise AssertionError(
                    f"{kp_id} has no refs but lacks the required concern"
                )
            continue

        verified_kps += 1
        publishers: set[str] = set()
        has_non_wikipedia = False
        for index, ref in enumerate(refs):
            if not isinstance(ref, dict) or set(ref) != REF_KEYS:
                raise AssertionError(
                    f"{kp_id}.refs[{index}] keys must be exactly url, publisher, quote"
                )
            is_valid, reason = valid_ref(ref)
            if not is_valid:
                raise AssertionError(f"invalid ref in {kp_id}.refs[{index}]: {reason}")
            if not all(ref[key].strip() for key in REF_KEYS):
                raise AssertionError(f"empty ref field in {kp_id}.refs[{index}]")
            publisher = normalize_publisher(ref)
            publishers.add(publisher)
            if publisher != "Wikipedia":
                has_non_wikipedia = True
            total_urls += 1
            failure = verify_refs.verify_ref(kp_id, ref, CACHE_DIR)
            if failure:
                failures.append(failure)

        if len(publishers) < 2:
            raise AssertionError(f"{kp_id} has fewer than two distinct publishers")
        if not has_non_wikipedia:
            raise AssertionError(f"{kp_id} has no non-Wikipedia publisher")

    if failures:
        raise AssertionError(
            "reference verification failed: "
            + json.dumps(failures, ensure_ascii=False, sort_keys=True)
        )

    print(
        json.dumps(
            {
                "allClean": True,
                "verifiedKPs": verified_kps,
                "unresolvedKPs": unresolved_kps,
                "totalUrls": total_urls,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
