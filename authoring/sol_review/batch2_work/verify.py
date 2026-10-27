#!/usr/bin/env python3
"""Fail-closed verifier for batch-2 knowledge-point source checks."""

from __future__ import annotations

import argparse
import base64
import concurrent.futures
import datetime
import hashlib
import html
from html.parser import HTMLParser
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import sys
import tempfile
import time
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


SCRIPT_DIR = Path(__file__).resolve().parent
NO_SOURCE_TEXT = "查無可確證之公開權威來源"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
TIMEOUT_SECONDS = 18
MAX_REDIRECTS = 10
MAX_BODY_BYTES = 20 * 1024 * 1024

SIMPLIFIED_ONLY = set(
    "这个们对国说为过时学来种与关让经么还动从样现实发体书语词历济门机车马鸟鱼页题区观运开间长单战军无万东业乐产买卖写听见认识议请谁调论变点应当总务层导带办华级约结给线终组织统络绝续维编网联职肤脑脸腊艺节药获虑蓝虽补装规视览觉计订训记讲设许证评译诉该详误读货费贸资质购赶趋轮软转轻较辅输边达迁远连进选递适逊遗邮郑释针钱铁银锁错镇闻阅队阳阶际陆险随隐难顶顺须顾顿预领频颜风飞饭饮馆驱验骑鸡麦齐齿龙龟"
)
PRC_WORDING = (
    "軟件",
    "視頻",
    "激光",
    "信息",
    "質量",
    "默認",
    "網絡",
    "U盤",
    "打印",
)
WIKIMEDIA_DOMAINS = (
    "wikipedia.org",
    "wiktionary.org",
    "wikisource.org",
    "wikimedia.org",
    "wikidata.org",
    "wikiquote.org",
    "wikibooks.org",
    "wikinews.org",
    "wikiversity.org",
    "wikivoyage.org",
    "mediawiki.org",
    "wikimediafoundation.org",
    "wikifunctions.org",
    "wmflabs.org",
)
WIKIMEDIA_PUBLISHER_TERMS = (
    "wikipedia",
    "wiktionary",
    "wikisource",
    "wikimedia",
    "wikidata",
    "wikiquote",
    "wikibooks",
    "wikinews",
    "wikiversity",
    "wikivoyage",
    "mediawiki",
    "wikifunctions",
    "wmflabs",
    "維基",
)
COMMON_MULTI_LABEL_SUFFIXES = {
    "ac.jp",
    "ac.uk",
    "asn.au",
    "co.jp",
    "co.kr",
    "co.nz",
    "co.uk",
    "com.au",
    "com.cn",
    "com.hk",
    "com.sg",
    "com.tw",
    "edu.au",
    "edu.cn",
    "edu.hk",
    "edu.tw",
    "go.jp",
    "go.kr",
    "gov.au",
    "gov.cn",
    "gov.hk",
    "gov.sg",
    "gov.tw",
    "gov.uk",
    "idv.tw",
    "net.au",
    "net.cn",
    "net.hk",
    "net.tw",
    "or.jp",
    "or.kr",
    "org.au",
    "org.cn",
    "org.hk",
    "org.nz",
    "org.tw",
    "org.uk",
}
PUBLISHER_ALIASES = {
    "moe": "教育部",
    "中華民國教育部": "教育部",
    "教育部國語推行委員會": "教育部",
    "教育部重編國語辭典修訂本": "教育部",
    "教育部成語典": "教育部",
    "教育部異體字字典": "教育部",
    "ministryofeducation": "教育部",
    "ministryofeducationroc": "教育部",
    "lawsmjgovtw": "全國法規資料庫",
    "全國法規資料庫入口網站": "全國法規資料庫",
}
BLOCKED_PAGE_MARKERS = (
    "captcha",
    "access denied",
    "just a moment",
    "cf-chl",
    "robot check",
    "robots check",
    "are you a robot",
    "verify you are human",
    "sign in to continue",
    "log in to continue",
    "請先登入",
    "登入後繼續",
    "驗證碼",
)
JAVASCRIPT_MARKERS = (
    "enable javascript",
    "javascript is required",
    "requires javascript",
    "please turn javascript on",
    "請啟用 javascript",
    "需要啟用 javascript",
)
REDIRECT_STATUSES = {301, 302, 303, 307, 308}


class DuplicateKeyError(ValueError):
    pass


class FetchFailure(Exception):
    def __init__(self, reason: str, retryable: bool = False):
        super().__init__(reason)
        self.reason = reason
        self.retryable = retryable


@dataclass(frozen=True)
class Page:
    url: str
    final_url: str
    status: int
    content_type: str
    body: bytes
    text: str
    visible_text: str


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hidden_depth = 0
        self.script_depth = 0
        self.visible_parts: list[str] = []
        self.script_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        lowered = tag.lower()
        if lowered in {"script", "style", "noscript"}:
            self.hidden_depth += 1
            if lowered == "script":
                self.script_depth += 1

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        return

    def handle_endtag(self, tag: str) -> None:
        lowered = tag.lower()
        if lowered in {"script", "style", "noscript"} and self.hidden_depth:
            self.hidden_depth -= 1
            if lowered == "script" and self.script_depth:
                self.script_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.script_depth:
            self.script_parts.append(data)
        elif not self.hidden_depth:
            self.visible_parts.append(data)


class NoRedirectHandler(HTTPRedirectHandler):
    def redirect_request(
        self,
        req: Request,
        fp: Any,
        code: int,
        msg: str,
        headers: Any,
        newurl: str,
    ) -> None:
        return None

    def http_error_301(self, req: Request, fp: Any, code: int, msg: str, headers: Any) -> Any:
        return fp

    http_error_302 = http_error_301
    http_error_303 = http_error_301
    http_error_307 = http_error_301
    http_error_308 = http_error_301


OPENER = build_opener(NoRedirectHandler())


def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle, object_pairs_hook=reject_duplicate_keys)


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u3000", " ")).strip()


def normalized_host(host: str) -> str:
    return host.rstrip(".").lower()


def belongs_to_domain(host: str, domain: str) -> bool:
    return host == domain or host.endswith("." + domain)


def wikimedia_host(host: str) -> bool:
    host = normalized_host(host)
    return any(belongs_to_domain(host, domain) for domain in WIKIMEDIA_DOMAINS)


def publisher_mentions_wikimedia(publisher: str) -> bool:
    lowered = publisher.casefold()
    return any(term.casefold() in lowered for term in WIKIMEDIA_PUBLISHER_TERMS)


def simplified_characters(value: str) -> list[str]:
    return sorted(set(value) & SIMPLIFIED_ONLY)


def normalize_publisher(publisher: str) -> str:
    lowered = publisher.casefold().replace("www.", "")
    compact = "".join(character for character in lowered if character.isalnum())
    return PUBLISHER_ALIASES.get(compact, compact)


def registrable_domain(url: str) -> str:
    host = normalized_host(urlsplit(url).hostname or "")
    try:
        ipaddress.ip_address(host)
        return host
    except ValueError:
        pass
    labels = host.split(".")
    if len(labels) <= 2:
        return host
    suffix2 = ".".join(labels[-2:])
    if suffix2 in COMMON_MULTI_LABEL_SUFFIXES and len(labels) >= 3:
        return ".".join(labels[-3:])
    return suffix2


def static_url_error(url: str) -> str | None:
    try:
        parsed = urlsplit(url)
        port = parsed.port
    except ValueError as error:
        return f"invalid URL: {error}"
    if parsed.scheme.lower() not in {"http", "https"}:
        return "URL scheme must be http or https"
    if not parsed.hostname:
        return "URL must contain a host"
    if parsed.username is not None or parsed.password is not None:
        return "URL credentials are prohibited"
    if port is not None and not 1 <= port <= 65535:
        return "URL port is invalid"
    host = normalized_host(parsed.hostname)
    if wikimedia_host(host):
        return f"Wikimedia URL host is prohibited: {host}"
    decoded_url = unquote(url)
    simplified = simplified_characters(decoded_url)
    if simplified:
        return "URL contains Simplified Chinese character(s): " + "".join(simplified)
    return None


def ensure_public_destination(url: str) -> None:
    error = static_url_error(url)
    if error:
        raise FetchFailure(error)
    parsed = urlsplit(url)
    host = parsed.hostname or ""
    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    try:
        addresses = {
            item[4][0]
            for item in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        }
    except socket.gaierror as error:
        raise FetchFailure(f"DNS resolution failed: {error}", retryable=True) from error
    if not addresses:
        raise FetchFailure("DNS resolution returned no addresses", retryable=True)
    for address_text in sorted(addresses):
        try:
            address = ipaddress.ip_address(address_text)
        except ValueError as error:
            raise FetchFailure(f"DNS returned invalid address: {address_text}") from error
        if not address.is_global:
            raise FetchFailure(f"non-public destination is prohibited: {address_text}")


def decode_body(body: bytes, content_type: str) -> str:
    match = re.search(r"charset\s*=\s*[\"']?([^;\s\"']+)", content_type, re.IGNORECASE)
    candidates: list[str] = []
    if match:
        candidates.append(match.group(1))
    candidates.extend(("utf-8", "big5"))
    seen: set[str] = set()
    for charset in candidates:
        lowered = charset.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        try:
            return body.decode(charset)
        except (LookupError, UnicodeDecodeError):
            continue
    raise FetchFailure("response body cannot be decoded with declared charset, UTF-8, or Big5")


def extract_visible_text(document: str) -> tuple[str, int]:
    parser = VisibleTextParser()
    try:
        parser.feed(document)
        parser.close()
    except Exception as error:
        raise FetchFailure(f"HTML parsing failed: {error}") from error
    visible = normalize_whitespace(html.unescape(" ".join(parser.visible_parts)))
    script_size = len("".join(parser.script_parts))
    return visible, script_size


def validate_page(page: Page) -> Page:
    mime_type = page.content_type.split(";", 1)[0].strip().lower()
    if mime_type not in {"text/html", "application/xhtml+xml"}:
        raise FetchFailure(f"non-HTML content-type: {page.content_type or '(missing)'}")
    visible, script_size = extract_visible_text(page.text)
    lowered_document = page.text.casefold()
    lowered_visible = visible.casefold()
    for marker in BLOCKED_PAGE_MARKERS:
        if marker.casefold() in lowered_document:
            raise FetchFailure(f"blocked/auth/captcha page marker found: {marker}")
    for marker in JAVASCRIPT_MARKERS:
        if marker.casefold() in lowered_visible:
            raise FetchFailure(f"JavaScript-only page marker found: {marker}")
    if len(visible) < 200:
        raise FetchFailure(f"near-empty page: visible text has {len(visible)} characters")
    if len(visible) < 500 and script_size > max(5000, len(visible) * 10):
        raise FetchFailure(
            f"JavaScript-only shell: {len(visible)} visible characters and {script_size} script characters"
        )
    return Page(
        url=page.url,
        final_url=page.final_url,
        status=page.status,
        content_type=page.content_type,
        body=page.body,
        text=page.text,
        visible_text=visible,
    )


def request_once(original_url: str) -> Page:
    current_url = original_url
    for redirect_count in range(MAX_REDIRECTS + 1):
        ensure_public_destination(current_url)
        request = Request(
            current_url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.7",
            },
        )
        try:
            response = OPENER.open(request, timeout=TIMEOUT_SECONDS)
        except HTTPError as error:
            if 500 <= error.code <= 599:
                raise FetchFailure(f"HTTP status {error.code}", retryable=True) from error
            raise FetchFailure(f"HTTP status {error.code}") from error
        except (TimeoutError, socket.timeout, URLError, OSError) as error:
            raise FetchFailure(f"network error: {error}", retryable=True) from error
        try:
            status = response.getcode()
            if status in REDIRECT_STATUSES:
                location = response.headers.get("Location")
                if not location:
                    raise FetchFailure(f"redirect status {status} has no Location header")
                if redirect_count >= MAX_REDIRECTS:
                    raise FetchFailure(f"too many redirects (more than {MAX_REDIRECTS})")
                next_url = urljoin(current_url, location)
                redirect_error = static_url_error(next_url)
                if redirect_error:
                    raise FetchFailure(f"redirect rejected: {redirect_error}")
                current_url = next_url
                continue
            if status != 200:
                if 500 <= status <= 599:
                    raise FetchFailure(f"HTTP status {status}", retryable=True)
                raise FetchFailure(f"HTTP status {status}")
            content_type = response.headers.get("Content-Type", "")
            body = response.read(MAX_BODY_BYTES + 1)
            if len(body) > MAX_BODY_BYTES:
                raise FetchFailure(f"response body exceeds {MAX_BODY_BYTES} bytes")
        except FetchFailure:
            raise
        except (TimeoutError, socket.timeout, URLError, OSError) as error:
            raise FetchFailure(f"network error while reading response: {error}", retryable=True) from error
        finally:
            response.close()
        text = decode_body(body, content_type)
        return validate_page(
            Page(
                url=original_url,
                final_url=current_url,
                status=status,
                content_type=content_type,
                body=body,
                text=text,
                visible_text="",
            )
        )
    raise FetchFailure(f"too many redirects (more than {MAX_REDIRECTS})")


def fetch_with_retry(url: str) -> Page:
    last_failure: FetchFailure | None = None
    for attempt in range(2):
        try:
            return request_once(url)
        except FetchFailure as failure:
            last_failure = failure
            if not failure.retryable or attempt == 1:
                raise
            time.sleep(0.25)
    assert last_failure is not None
    raise last_failure


def cache_path(cache_dir: Path, url: str) -> Path:
    return cache_dir / f"{hashlib.sha256(url.encode('utf-8')).hexdigest()}.json"


def load_cached_page(cache_dir: Path, url: str) -> Page | None:
    path = cache_path(cache_dir, url)
    if not path.is_file():
        return None
    try:
        data = load_json(path)
        if not isinstance(data, dict):
            return None
        if data.get("url") != url or data.get("status") != 200:
            return None
        final_url = data.get("finalUrl")
        content_type = data.get("contentType")
        if not isinstance(final_url, str) or not isinstance(content_type, str):
            return None
        if static_url_error(final_url):
            return None
        body_b64 = data.get("bodyB64")
        body_text = data.get("body")
        if isinstance(body_b64, str):
            body = base64.b64decode(body_b64, validate=True)
            text = decode_body(body, content_type)
        elif isinstance(body_text, str):
            text = body_text
            body = body_text.encode("utf-8")
        else:
            return None
        return validate_page(
            Page(
                url=url,
                final_url=final_url,
                status=200,
                content_type=content_type,
                body=body,
                text=text,
                visible_text="",
            )
        )
    except (OSError, ValueError, FetchFailure):
        return None


def save_cached_page(cache_dir: Path, page: Page) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "url": page.url,
        "finalUrl": page.final_url,
        "status": page.status,
        "contentType": page.content_type,
        "bodyB64": base64.b64encode(page.body).decode("ascii"),
        "fetchedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    target = cache_path(cache_dir, page.url)
    file_descriptor, temporary_name = tempfile.mkstemp(
        dir=cache_dir, prefix=target.name + ".", suffix=".tmp"
    )
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, sort_keys=True)
            handle.write("\n")
        os.replace(temporary_name, target)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def get_page(cache_dir: Path, url: str, refetch: bool) -> Page:
    if not refetch:
        cached = load_cached_page(cache_dir, url)
        if cached is not None:
            return cached
    page = fetch_with_retry(url)
    save_cached_page(cache_dir, page)
    return page


def failure_record(kp_id: str, url: str, reason: str) -> dict[str, str]:
    return {"kp_id": kp_id, "url": url, "reason": reason}


def parse_ids(path: Path) -> tuple[list[str] | None, list[dict[str, str]]]:
    failures: list[dict[str, str]] = []
    try:
        data = load_json(path)
    except (OSError, UnicodeError, json.JSONDecodeError, DuplicateKeyError) as error:
        return None, [failure_record("<ids>", "", f"cannot load ids JSON: {error}")]
    if not isinstance(data, list):
        return None, [failure_record("<ids>", "", "ids JSON must be an array")]
    ids: list[str] = []
    for index, item in enumerate(data):
        if not isinstance(item, dict) or not isinstance(item.get("kp_id"), str):
            failures.append(
                failure_record("<ids>", "", f"ids[{index}] must contain a string kp_id")
            )
            continue
        ids.append(item["kp_id"])
    if len(ids) != 90:
        failures.append(failure_record("<ids>", "", f"ids JSON must contain exactly 90 ids, got {len(ids)}"))
    if len(set(ids)) != len(ids):
        failures.append(failure_record("<ids>", "", "ids JSON contains duplicate kp_id values"))
    return (ids if not failures else None), failures


def validate_input_schema(
    data: Any, expected_ids: list[str], partial: bool
) -> tuple[dict[str, Any], list[dict[str, str]]]:
    failures: list[dict[str, str]] = []
    if not isinstance(data, dict):
        return {}, [failure_record("<input>", "", "top level must be an object")]
    if set(data) != {"checks"}:
        failures.append(
            failure_record("<input>", "", "top level must contain only the key 'checks'")
        )
    checks = data.get("checks")
    if not isinstance(checks, dict):
        failures.append(failure_record("<input>", "", "checks must be an object"))
        return {}, failures

    expected_set = set(expected_ids)
    actual_set = set(checks)
    extras = sorted(actual_set - expected_set)
    for kp_id in extras:
        failures.append(failure_record(kp_id, "", "kp_id is not present in ids.json"))
    if not partial:
        for kp_id in sorted(expected_set - actual_set):
            failures.append(failure_record(kp_id, "", "required kp_id is missing"))

    for kp_id in sorted(actual_set):
        check = checks[kp_id]
        if not isinstance(check, dict):
            failures.append(failure_record(kp_id, "", "check must be an object"))
            continue
        required = {"claim", "refs", "concern"}
        if set(check) != required:
            missing = sorted(required - set(check))
            extra = sorted(set(check) - required)
            details: list[str] = []
            if missing:
                details.append("missing keys: " + ", ".join(missing))
            if extra:
                details.append("unknown keys: " + ", ".join(extra))
            failures.append(failure_record(kp_id, "", "; ".join(details)))
        claim = check.get("claim")
        concern = check.get("concern")
        refs = check.get("refs")
        if not isinstance(claim, str):
            failures.append(failure_record(kp_id, "", "claim must be a string"))
        if not isinstance(concern, str):
            failures.append(failure_record(kp_id, "", "concern must be a string"))
        if not isinstance(refs, list):
            failures.append(failure_record(kp_id, "", "refs must be an array"))
            continue

        for field_name, field_value in (("claim", claim), ("concern", concern)):
            if not isinstance(field_value, str):
                continue
            simplified = simplified_characters(field_value)
            if simplified:
                failures.append(
                    failure_record(
                        kp_id,
                        "",
                        f"{field_name} contains Simplified Chinese character(s): {''.join(simplified)}",
                    )
                )
            for wording in PRC_WORDING:
                if wording.casefold() in field_value.casefold():
                    failures.append(
                        failure_record(kp_id, "", f"{field_name} contains PRC wording: {wording}")
                    )

        if not refs:
            if not isinstance(concern, str) or NO_SOURCE_TEXT not in concern:
                failures.append(
                    failure_record(
                        kp_id,
                        "",
                        f"refs is empty, so concern must contain exact text: {NO_SOURCE_TEXT}",
                    )
                )
            continue
        if isinstance(concern, str) and not concern and len(refs) < 2:
            failures.append(
                failure_record(kp_id, "", "empty concern requires at least two verified refs")
            )

        valid_identity_refs: list[tuple[str, str]] = []
        for index, ref in enumerate(refs):
            label = f"refs[{index}]"
            if not isinstance(ref, dict):
                failures.append(failure_record(kp_id, "", f"{label} must be an object"))
                continue
            required_ref = {"url", "publisher", "quote"}
            if set(ref) != required_ref:
                missing = sorted(required_ref - set(ref))
                extra = sorted(set(ref) - required_ref)
                details = []
                if missing:
                    details.append("missing keys: " + ", ".join(missing))
                if extra:
                    details.append("unknown keys: " + ", ".join(extra))
                failures.append(failure_record(kp_id, str(ref.get("url", "")), f"{label}: {'; '.join(details)}"))
            typed_values = True
            for field_name in ("url", "publisher", "quote"):
                value = ref.get(field_name)
                if not isinstance(value, str) or not value:
                    typed_values = False
                    failures.append(
                        failure_record(kp_id, str(ref.get("url", "")), f"{label}.{field_name} must be a non-empty string")
                    )
            if not typed_values:
                continue
            url = ref["url"]
            publisher = ref["publisher"]
            quote = ref["quote"]
            url_error = static_url_error(url)
            if url_error:
                failures.append(failure_record(kp_id, url, url_error))
            if publisher_mentions_wikimedia(publisher):
                failures.append(
                    failure_record(kp_id, url, "publisher mentions a prohibited Wikimedia source")
                )
            normalized_quote = normalize_whitespace(quote)
            if not 10 <= len(normalized_quote) <= 40:
                failures.append(
                    failure_record(
                        kp_id,
                        url,
                        f"normalized quote length must be 10-40 characters, got {len(normalized_quote)}",
                    )
                )
            if not url_error and not publisher_mentions_wikimedia(publisher):
                valid_identity_refs.append(
                    (normalize_publisher(publisher), registrable_domain(url))
                )

        has_distinct_pair = any(
            left_publisher != right_publisher and left_domain != right_domain
            for index, (left_publisher, left_domain) in enumerate(valid_identity_refs)
            for right_publisher, right_domain in valid_identity_refs[index + 1 :]
        )
        if not has_distinct_pair:
            failures.append(
                failure_record(
                    kp_id,
                    "",
                    "non-empty refs require two refs with distinct normalized publishers and registrable domains",
                )
            )
    return checks, failures


def write_report(path: Path, report: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def make_report(
    checked_kps: int, failures: list[dict[str, str]], ok_refs: int
) -> dict[str, Any]:
    ordered_failures = sorted(
        failures, key=lambda item: (item["kp_id"], item["url"], item["reason"])
    )
    failed_kps = sorted({item["kp_id"] for item in ordered_failures})
    return {
        "allClean": not ordered_failures,
        "checkedKps": checked_kps,
        "failedKps": failed_kps,
        "failures": ordered_failures,
        "okRefs": ok_refs,
    }


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="checks JSON file")
    parser.add_argument(
        "--ids", type=Path, default=SCRIPT_DIR / "ids.json", help="expected ids JSON file"
    )
    parser.add_argument("--cache", type=Path, required=True, help="successful page cache directory")
    parser.add_argument("--report", type=Path, required=True, help="output report JSON file")
    parser.add_argument(
        "--partial", action="store_true", help="require only ids present in the input"
    )
    parser.add_argument(
        "--refetch", action="store_true", help="bypass successful cached pages"
    )
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    failures: list[dict[str, str]] = []
    ids, id_failures = parse_ids(arguments.ids)
    failures.extend(id_failures)
    data: Any = None
    if ids is not None:
        try:
            data = load_json(arguments.input)
        except (OSError, UnicodeError, json.JSONDecodeError, DuplicateKeyError) as error:
            failures.append(failure_record("<input>", "", f"cannot load input JSON: {error}"))

    checks: dict[str, Any] = {}
    if ids is not None and data is not None:
        checks, schema_failures = validate_input_schema(data, ids, arguments.partial)
        failures.extend(schema_failures)

    checked_kps = len(checks)
    ok_refs = 0
    if not failures:
        refs_by_url: dict[str, list[tuple[str, str]]] = {}
        for kp_id, check in checks.items():
            for ref in check["refs"]:
                refs_by_url.setdefault(ref["url"], []).append((kp_id, ref["quote"]))

        page_results: dict[str, Page | FetchFailure] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(get_page, arguments.cache, url, arguments.refetch): url
                for url in sorted(refs_by_url)
            }
            for future in concurrent.futures.as_completed(futures):
                url = futures[future]
                try:
                    page_results[url] = future.result()
                except FetchFailure as error:
                    page_results[url] = error
                except Exception as error:
                    page_results[url] = FetchFailure(f"unexpected fetch error: {error}")

        verified_by_kp: dict[str, int] = {kp_id: 0 for kp_id in checks}
        for url in sorted(refs_by_url):
            result = page_results[url]
            for kp_id, quote in refs_by_url[url]:
                if isinstance(result, FetchFailure):
                    failures.append(failure_record(kp_id, url, result.reason))
                    continue
                normalized_quote = normalize_whitespace(quote)
                if normalized_quote not in result.visible_text:
                    failures.append(
                        failure_record(kp_id, url, "quote is not a verbatim visible-text substring")
                    )
                    continue
                ok_refs += 1
                verified_by_kp[kp_id] += 1

        for kp_id, check in checks.items():
            if check["refs"] and not check["concern"] and verified_by_kp[kp_id] < 2:
                failures.append(
                    failure_record(kp_id, "", "empty concern requires at least two verified refs")
                )

    report = make_report(checked_kps, failures, ok_refs)
    try:
        write_report(arguments.report, report)
    except OSError as error:
        print(f"cannot write report: {error}", file=sys.stderr)
        return 1
    return 0 if report["allClean"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
