#!/usr/bin/env python3
"""Consolidate and fail closed on batch-one cross-check research results."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

WORK_DIR = Path(__file__).resolve().parent
IDS_PATH = WORK_DIR / "ids.json"
MERGED_PATH = WORK_DIR / "merged.json"
REPORT_PATH = WORK_DIR / "consolidate_report.json"
FALLBACK_CLAIM = "(未查證)"
FALLBACK_CONCERN = "查無可確證之公開權威來源"
ENTRY_KEYS = {"claim", "refs", "concern"}
REF_KEYS = {"url", "publisher", "quote"}

# Unambiguous simplified-only characters expected in prose. Ambiguous characters
# that are also valid Traditional Chinese are intentionally not replaced blindly.
SIMPLIFIED_TO_TRADITIONAL = str.maketrans(
    {
        "这": "這", "个": "個", "们": "們", "国": "國", "学": "學",
        "对": "對", "时": "時", "说": "說", "观": "觀", "点": "點",
        "与": "與", "为": "為", "来": "來", "过": "過", "还": "還",
        "发": "發", "现": "現", "实": "實", "经": "經", "种": "種",
        "动": "動", "关": "關", "业": "業", "产": "產", "从": "從",
        "应": "應", "会": "會", "开": "開", "网": "網", "软": "軟",
        "论": "論", "书": "書", "间": "間", "该": "該", "无": "無",
        "条": "條", "样": "樣", "机": "機", "级": "級", "区": "區",
        "员": "員", "体": "體", "义": "義", "语": "語", "词": "詞",
        "号": "號", "线": "線", "达": "達", "统": "統", "则": "則",
        "处": "處", "问": "問", "题": "題", "气": "氣", "转": "轉",
        "变": "變", "术": "術", "数": "數", "据": "據", "仅": "僅",
        "并": "並", "导": "導", "较": "較", "复": "複", "验": "驗",
        "认": "認", "证": "證", "权": "權", "显": "顯", "标": "標",
        "组": "組", "织": "織", "层": "層", "构": "構",
        "径": "徑", "测": "測", "试": "試", "护": "護", "读": "讀",
        "写": "寫", "类": "類", "别": "別", "见": "見", "将": "將",
        "强": "強", "华": "華", "爱": "愛", "离": "離", "张": "張",
        "务": "務", "争": "爭", "议": "議", "决": "決", "择": "擇",
        "济": "濟", "质": "質", "总": "總", "额": "額", "万": "萬",
        "亿": "億", "历": "歷", "广": "廣", "边": "邊", "门": "門",
        "场": "場", "车": "車", "马": "馬", "长": "長", "岛": "島",
        "风": "風", "云": "雲", "电": "電", "热": "熱", "压": "壓",
        "险": "險", "医": "醫", "药": "藥", "剂": "劑", "伤": "傷",
        "卫": "衛", "导": "導", "优": "優", "调": "調", "节": "節",
        "户": "戶", "严": "嚴", "众": "眾", "农": "農", "乡": "鄉",
        "县": "縣", "镇": "鎮", "划": "劃", "设": "設", "备": "備",
        "资": "資", "讯": "訊", "际": "際", "约": "約", "与": "與",
        "规": "規", "范": "範", "违": "違", "罚": "罰", "责": "責",
        "诉": "訴", "审": "審", "执": "執", "察": "察", "检": "檢",
        "举": "舉", "选": "選", "团": "團", "结": "結", "传": "傳",
        "续": "續", "记": "記", "录": "錄", "万": "萬", "专": "專",
        "师": "師", "儿": "兒", "童": "童", "参": "參", "预": "預",
        "险": "險", "划": "劃", "别": "別", "础": "礎", "础": "礎",
    }
)
SIMPLIFIED_CHARS = {
    chr(codepoint)
    for codepoint, traditional in SIMPLIFIED_TO_TRADITIONAL.items()
    if chr(codepoint) != traditional
}
PRC_TERMS = {
    "軟件": "軟體",
    "软件": "軟體",
    "信息": "資訊",
    "網絡": "網路",
    "网络": "網路",
    "視頻": "影片",
    "视频": "影片",
}
ALLOWED_CONTINENTAL_TERMS = (
    "大陸棚", "大陸性", "歐亞大陸", "大陸地殼", "大陸塊", "大陸邊緣",
    "大陸斜坡", "大陸漂移", "大陸板塊", "大陸坡", "大陸隆",
)


def record(adjustments: list[dict[str, Any]], kind: str, **details: Any) -> None:
    adjustments.append({"kind": kind, **details})


def rewrite_text(text: str) -> tuple[str, list[str]]:
    original = text
    reasons: list[str] = []

    for term, replacement in PRC_TERMS.items():
        if term in text:
            text = text.replace(term, replacement)
            reasons.append(f"PRC 用語 {term}→{replacement}")

    for phrase in ("中国大陆", "中國大陸"):
        if phrase in text:
            text = text.replace(phrase, "中國")
            reasons.append(f"禁用地域稱呼 {phrase}→中國")
    if "大陆" in text:
        text = text.replace("大陆", "中國")
        reasons.append("禁用地域稱呼 大陆→中國")

    protected: dict[str, str] = {}
    for index, term in enumerate(ALLOWED_CONTINENTAL_TERMS):
        if term in text:
            token = f"\u0000CONTINENTAL_{index}\u0000"
            protected[token] = term
            text = text.replace(term, token)
    if "大陸" in text:
        text = text.replace("大陸", "中國")
        reasons.append("禁用地域稱呼 大陸→中國")
    for token, term in protected.items():
        text = text.replace(token, term)

    found_simplified = sorted(set(text) & SIMPLIFIED_CHARS)
    if found_simplified:
        text = text.translate(SIMPLIFIED_TO_TRADITIONAL)
        reasons.append("簡體字轉繁體：" + "".join(found_simplified))

    if text == original:
        return text, []
    return text, reasons


def normalize_publisher(ref: dict[str, str]) -> str:
    hostname = (urlsplit(ref["url"]).hostname or "").lower().rstrip(".")
    publisher = " ".join(ref["publisher"].split()).casefold()
    if hostname == "wikipedia.org" or hostname.endswith(".wikipedia.org"):
        return "Wikipedia"
    if publisher in {
        "wikipedia", "維基百科", "维基百科", "wikimedia foundation",
        "維基媒體基金會", "维基媒体基金会",
    }:
        return "Wikipedia"
    return publisher


def valid_ref(ref: Any) -> tuple[bool, str]:
    if not isinstance(ref, dict):
        return False, "ref 不是物件"
    if set(ref) != REF_KEYS:
        return False, "ref 欄位必須恰為 url、publisher、quote"
    if not all(isinstance(ref[key], str) for key in REF_KEYS):
        return False, "ref 的 url、publisher、quote 必須是字串"
    parsed = urlsplit(ref["url"])
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        return False, "ref URL 必須是有效的 HTTP(S) URL"
    return True, ""


def fallback_entry() -> dict[str, Any]:
    return {
        "claim": FALLBACK_CLAIM,
        "refs": [],
        "concern": FALLBACK_CONCERN,
    }


def load_ids() -> tuple[list[str], set[str]]:
    with IDS_PATH.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError("ids.json must contain a list")
    ids: list[str] = []
    for index, item in enumerate(data):
        if not isinstance(item, dict) or not isinstance(item.get("kp_id"), str):
            raise ValueError(f"ids.json item {index} has no string kp_id")
        ids.append(item["kp_id"])
    if len(ids) != 137 or len(set(ids)) != 137:
        raise ValueError("ids.json must contain exactly 137 unique kp_id values")
    return ids, set(ids)


def process_entry(
    kp_id: str,
    entry: Any,
    source: str,
    adjustments: list[dict[str, Any]],
) -> tuple[dict[str, Any], bool]:
    if not isinstance(entry, dict) or set(entry) != ENTRY_KEYS:
        record(
            adjustments,
            "invalid_entry_schema",
            kp_id=kp_id,
            source=source,
            action="replaced_with_fallback",
        )
        return fallback_entry(), True
    if not isinstance(entry["claim"], str) or not isinstance(entry["concern"], str):
        record(
            adjustments,
            "invalid_entry_schema",
            kp_id=kp_id,
            source=source,
            detail="claim and concern must be strings",
            action="replaced_with_fallback",
        )
        return fallback_entry(), True
    if not isinstance(entry["refs"], list):
        record(
            adjustments,
            "invalid_entry_schema",
            kp_id=kp_id,
            source=source,
            detail="refs must be an array",
            action="replaced_with_fallback",
        )
        return fallback_entry(), True

    claim, claim_reasons = rewrite_text(entry["claim"])
    concern, concern_reasons = rewrite_text(entry["concern"])
    if claim_reasons:
        record(
            adjustments,
            "text_rewritten",
            kp_id=kp_id,
            source=source,
            field="claim",
            original=entry["claim"],
            replacement=claim,
            reasons=claim_reasons,
        )
    if concern_reasons:
        record(
            adjustments,
            "text_rewritten",
            kp_id=kp_id,
            source=source,
            field="concern",
            original=entry["concern"],
            replacement=concern,
            reasons=concern_reasons,
        )

    invalid_reasons: list[str] = []
    for index, ref in enumerate(entry["refs"]):
        is_valid, reason = valid_ref(ref)
        if not is_valid:
            invalid_reasons.append(f"refs[{index}]: {reason}")

    if invalid_reasons:
        record(
            adjustments,
            "demoted",
            kp_id=kp_id,
            source=source,
            reasons=invalid_reasons,
            action="cleared_refs_and_replaced_concern",
        )
        return {"claim": claim, "refs": [], "concern": FALLBACK_CONCERN}, True

    refs: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for index, ref in enumerate(entry["refs"]):
        url_key = ref["url"].strip()
        if url_key in seen_urls:
            record(
                adjustments,
                "duplicate_ref_dropped",
                kp_id=kp_id,
                source=source,
                index=index,
                url=ref["url"],
            )
            continue
        seen_urls.add(url_key)
        refs.append(ref)

    normalized_publishers = {normalize_publisher(ref) for ref in refs}
    has_non_wikipedia = any(normalize_publisher(ref) != "Wikipedia" for ref in refs)
    demotion_reasons: list[str] = []
    if len(normalized_publishers) < 2:
        demotion_reasons.append("少於 2 個不同的正規化出版者")
    if not has_non_wikipedia:
        demotion_reasons.append("沒有非 Wikipedia 來源")
    if demotion_reasons:
        record(
            adjustments,
            "demoted",
            kp_id=kp_id,
            source=source,
            reasons=demotion_reasons,
            retained_ref_count=len(refs),
            normalized_publishers=sorted(normalized_publishers),
            action="cleared_refs_and_replaced_concern",
        )
        return {"claim": claim, "refs": [], "concern": FALLBACK_CONCERN}, True

    return {"claim": claim, "refs": refs, "concern": concern}, False


def validate_final(checks: dict[str, Any], expected_ids: set[str]) -> None:
    if set(checks) != expected_ids or len(checks) != 137:
        raise AssertionError("merged checks do not exactly cover the 137 expected IDs")
    forbidden_phrases = ("中国大陆", "中國大陸", "大陆", "軟件", "信息", "網絡", "視頻")
    for kp_id, entry in checks.items():
        if set(entry) != ENTRY_KEYS:
            raise AssertionError(f"invalid final entry schema: {kp_id}")
        for field in ("claim", "concern"):
            text = entry[field]
            if set(text) & SIMPLIFIED_CHARS:
                raise AssertionError(f"simplified character remains in {kp_id}.{field}")
            if any(phrase in text for phrase in forbidden_phrases):
                raise AssertionError(f"forbidden phrase remains in {kp_id}.{field}")
            scrubbed = text
            for term in ALLOWED_CONTINENTAL_TERMS:
                scrubbed = scrubbed.replace(term, "")
            if "大陸" in scrubbed:
                raise AssertionError(f"forbidden 大陸 remains in {kp_id}.{field}")
        for ref in entry["refs"]:
            is_valid, reason = valid_ref(ref)
            if not is_valid:
                raise AssertionError(f"invalid final ref in {kp_id}: {reason}")
        publishers = {normalize_publisher(ref) for ref in entry["refs"]}
        if entry["refs"] and (
            len(publishers) < 2 or publishers == {"Wikipedia"}
        ):
            raise AssertionError(f"unqualified refs remain in {kp_id}")


def main() -> None:
    id_order, expected_ids = load_ids()
    adjustments: list[dict[str, Any]] = []
    accepted: dict[str, tuple[Any, str]] = {}
    part_files = sorted(WORK_DIR.glob("part_*.json"))

    for path in part_files:
        try:
            with path.open(encoding="utf-8") as handle:
                data = json.load(handle)
        except (OSError, UnicodeError, json.JSONDecodeError) as error:
            record(
                adjustments,
                "malformed_part_file",
                source=path.name,
                detail=str(error),
                action="ignored_file",
            )
            continue
        if not isinstance(data, dict) or set(data) != {"checks"} or not isinstance(data["checks"], dict):
            record(
                adjustments,
                "invalid_part_schema",
                source=path.name,
                action="ignored_file",
            )
            continue
        for kp_id, entry in data["checks"].items():
            if kp_id not in expected_ids:
                record(
                    adjustments,
                    "unknown_id_dropped",
                    kp_id=kp_id,
                    source=path.name,
                )
                continue
            if kp_id in accepted:
                record(
                    adjustments,
                    "duplicate_id_dropped",
                    kp_id=kp_id,
                    source=path.name,
                    kept_source=accepted[kp_id][1],
                )
                continue
            accepted[kp_id] = (entry, path.name)

    checks: dict[str, dict[str, Any]] = {}
    demoted_ids: set[str] = set()
    for kp_id in id_order:
        if kp_id not in accepted:
            checks[kp_id] = fallback_entry()
            demoted_ids.add(kp_id)
            record(
                adjustments,
                "missing_id_added",
                kp_id=kp_id,
                action="added_fallback",
            )
            continue
        entry, source = accepted[kp_id]
        checks[kp_id], demoted = process_entry(kp_id, entry, source, adjustments)
        if demoted:
            demoted_ids.add(kp_id)

    validate_final(checks, expected_ids)
    qualified_count = sum(1 for entry in checks.values() if len(entry["refs"]) >= 2)
    demoted_count = sum(1 for entry in checks.values() if not entry["refs"])
    report = {
        "summary": {
            "part_files_found": len(part_files),
            "expected_ids": len(expected_ids),
            "merged_ids": len(checks),
            "kps_with_at_least_2_refs": qualified_count,
            "demoted_kps": demoted_count,
            "adjustment_count": len(adjustments),
        },
        "adjustments": adjustments,
    }

    with MERGED_PATH.open("w", encoding="utf-8") as handle:
        json.dump({"checks": checks}, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    with REPORT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(json.dumps(report["summary"], ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
