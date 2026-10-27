#!/usr/bin/env python3
"""Fail-closed verification of quoted references in a merged checks file."""

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import urllib.error
import urllib.parse
import urllib.request


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
TIMEOUT_SECONDS = 30
RETRIES = 2
MIN_VISIBLE_TEXT_LENGTH = 80
WIKIMEDIA_HOST_SUFFIXES = (
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
)
SKIPPED_ELEMENTS = {"script", "style", "noscript", "template"}
WHITESPACE_RE = re.compile(r"\s+")
META_CHARSET_RE = re.compile(
    br"<meta\b[^>]*\bcharset\s*=\s*[\"']?\s*([a-zA-Z0-9._-]+)", re.IGNORECASE
)
META_CONTENT_CHARSET_RE = re.compile(
    br"<meta\b[^>]*\bcontent\s*=\s*[\"'][^\"']*charset\s*=\s*([a-zA-Z0-9._-]+)",
    re.IGNORECASE,
)
BLOCKED_RAW_MARKERS = (
    b"cf-browser-verification",
    b"cf-chl-",
    b"/challenge-platform/",
)
BLOCKED_TEXT_MARKERS = (
    "access denied",
    "attention required",
    "captcha",
    "checking your browser",
    "enable javascript and cookies to continue",
    "request blocked",
    "robot check",
    "verify you are human",
    "verify that you are human",
)


class VisibleTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self._skip_depth = 0
        self._parts: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag.lower() in SKIPPED_ELEMENTS:
            self._skip_depth += 1

    def handle_startendtag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        return

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in SKIPPED_ELEMENTS and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self._parts.append(data)

    def handle_entityref(self, name: str) -> None:
        if not self._skip_depth:
            self._parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if not self._skip_depth:
            self._parts.append(f"&#{name};")

    def text(self) -> str:
        return normalize_text(" ".join(self._parts))


def normalize_text(value: str) -> str:
    return WHITESPACE_RE.sub(" ", html.unescape(value)).strip()


def canonical_charset(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    normalized = value.strip().lower().replace("_", "-")
    if normalized in {"utf-8", "utf8"}:
        return "utf-8"
    if normalized in {"big5", "big-5", "big5-hkscs", "cp950", "ms950"}:
        return "big5"
    return None


def detect_charset(body: bytes, header_charset: Optional[str]) -> str:
    charset = canonical_charset(header_charset)
    if charset:
        return charset

    sample = body[:65536]
    for pattern in (META_CHARSET_RE, META_CONTENT_CHARSET_RE):
        match = pattern.search(sample)
        if match:
            charset = canonical_charset(match.group(1).decode("ascii", errors="ignore"))
            if charset:
                return charset

    if body.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    try:
        body.decode("utf-8")
        return "utf-8"
    except UnicodeDecodeError:
        return "big5"


def extract_visible_text(body: bytes, header_charset: Optional[str]) -> str:
    charset = detect_charset(body, header_charset)
    decoded = body.decode(charset, errors="replace")
    parser = VisibleTextExtractor()
    try:
        parser.feed(decoded)
        parser.close()
    except Exception:
        # HTMLParser can still retain safely extracted text from malformed HTML.
        pass
    return parser.text()


def request_url(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    hostname = parts.hostname.encode("idna").decode("ascii") if parts.hostname else ""
    if ":" in hostname and not hostname.startswith("["):
        hostname = f"[{hostname}]"
    userinfo = ""
    if parts.username is not None:
        userinfo = urllib.parse.quote(parts.username, safe="")
        if parts.password is not None:
            userinfo += ":" + urllib.parse.quote(parts.password, safe="")
        userinfo += "@"
    port = f":{parts.port}" if parts.port is not None else ""
    netloc = f"{userinfo}{hostname}{port}"
    path = urllib.parse.quote(urllib.parse.unquote(parts.path), safe="/%:@!$&'()*+,;=-._~")
    query = urllib.parse.quote(urllib.parse.unquote(parts.query), safe="=&?/:;+,%@!$'()*-._~")
    fragment = urllib.parse.quote(urllib.parse.unquote(parts.fragment), safe="?/:;+,%@!$&'()*=-._~")
    return urllib.parse.urlunsplit((parts.scheme, netloc, path, query, fragment))


def cache_paths(cache_dir: Path, url: str) -> Tuple[Path, Path]:
    key = hashlib.sha1(url.encode("utf-8")).hexdigest()
    return cache_dir / f"{key}.body", cache_dir / f"{key}.json"


def write_cache(
    cache_dir: Path,
    url: str,
    body: bytes,
    metadata: Dict[str, Any],
) -> None:
    body_path, metadata_path = cache_paths(cache_dir, url)
    body_path.write_bytes(body)
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def fetch(url: str, cache_dir: Path) -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        write_cache(cache_dir, url, b"", {"attempts": [], "error": "invalid URL", "url": url})
        return None, None, "invalid URL"

    try:
        encoded_url = request_url(url)
    except (UnicodeError, ValueError) as error:
        reason = f"invalid URL: {error}"
        write_cache(cache_dir, url, b"", {"attempts": [], "error": reason, "url": url})
        return None, None, reason

    attempt_records: List[Dict[str, Any]] = []
    last_reason = "fetch failed"
    last_body = b""
    for attempt in range(RETRIES + 1):
        request = urllib.request.Request(
            encoded_url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.8,zh-TW;q=0.7",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
                status = response.getcode()
                body = response.read()
                last_body = body
                content_type = response.headers.get_content_type().lower()
                header_charset = response.headers.get_content_charset()
                final_url = response.geturl()
                attempt_records.append(
                    {
                        "attempt": attempt + 1,
                        "contentType": response.headers.get("Content-Type", ""),
                        "finalUrl": final_url,
                        "status": status,
                    }
                )
                if status != 200:
                    last_reason = f"HTTP {status}"
                else:
                    write_cache(
                        cache_dir,
                        url,
                        body,
                        {
                            "attempts": attempt_records,
                            "contentType": response.headers.get("Content-Type", ""),
                            "finalUrl": final_url,
                            "status": status,
                            "url": url,
                        },
                    )
                    if content_type not in {"text/html", "application/xhtml+xml"}:
                        return None, None, f"non-HTML content-type: {content_type or 'missing'}"
                    return body, header_charset, None
        except urllib.error.HTTPError as error:
            try:
                last_body = error.read()
            except Exception:
                last_body = b""
            last_reason = f"HTTP {error.code}"
            attempt_records.append(
                {
                    "attempt": attempt + 1,
                    "error": last_reason,
                    "finalUrl": error.geturl(),
                    "status": error.code,
                }
            )
        except (urllib.error.URLError, TimeoutError, OSError, UnicodeError, ValueError) as error:
            detail = getattr(error, "reason", error)
            last_reason = f"network error: {detail}"
            attempt_records.append({"attempt": attempt + 1, "error": last_reason})

        if attempt < RETRIES:
            time.sleep(attempt + 1)

    write_cache(
        cache_dir,
        url,
        last_body,
        {"attempts": attempt_records, "error": last_reason, "url": url},
    )
    return None, None, last_reason


def blocked_or_captcha(body: bytes, visible_text: str) -> bool:
    raw_lower = body.lower()
    if any(marker in raw_lower for marker in BLOCKED_RAW_MARKERS):
        return True
    inspection_text = visible_text[:2000].lower()
    return any(marker in inspection_text for marker in BLOCKED_TEXT_MARKERS)


def is_wikimedia_url(url: str) -> bool:
    try:
        hostname = (urllib.parse.urlsplit(url).hostname or "").lower().rstrip(".")
    except ValueError:
        return False
    return any(
        hostname == suffix or hostname.endswith(f".{suffix}")
        for suffix in WIKIMEDIA_HOST_SUFFIXES
    )


def verify_ref(kp_id: str, ref: Any, cache_dir: Path) -> Optional[Dict[str, str]]:
    if not isinstance(ref, dict):
        return {"kp_id": kp_id, "url": "", "reason": "reference is not an object"}

    url = ref.get("url")
    quote = ref.get("quote")
    if not isinstance(url, str) or not url.strip():
        return {"kp_id": kp_id, "url": "", "reason": "missing URL"}
    url = url.strip()

    body, header_charset, fetch_error = fetch(url, cache_dir)
    if fetch_error:
        return {"kp_id": kp_id, "url": url, "reason": fetch_error}
    assert body is not None

    visible_text = extract_visible_text(body, header_charset)
    if blocked_or_captcha(body, visible_text):
        return {"kp_id": kp_id, "url": url, "reason": "blocked/captcha page"}
    if len(visible_text) < MIN_VISIBLE_TEXT_LENGTH:
        return {
            "kp_id": kp_id,
            "url": url,
            "reason": f"near-empty visible text ({len(visible_text)} chars)",
        }
    if not isinstance(quote, str) or not normalize_text(quote):
        return {"kp_id": kp_id, "url": url, "reason": "missing or empty quote"}
    if normalize_text(quote) not in visible_text:
        return {"kp_id": kp_id, "url": url, "reason": "quote not found verbatim"}
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="input_file", required=True)
    parser.add_argument("--report", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input_file)
    report_path = Path(args.report)
    work_dir = Path(__file__).resolve().parent
    cache_dir = work_dir / "fetch_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    with input_path.open("r", encoding="utf-8") as source:
        payload = json.load(source)
    checks = payload.get("checks")
    if not isinstance(checks, dict):
        raise ValueError("input must contain a checks object")

    total_urls = 0
    failed_refs: List[Dict[str, str]] = []
    kps_with_failures: List[str] = []
    seen_failed_kps = set()

    for kp_id, check in checks.items():
        refs = check.get("refs", []) if isinstance(check, dict) else []
        if not isinstance(refs, list):
            refs = [refs]
        for ref in refs:
            total_urls += 1
            failure = verify_ref(str(kp_id), ref, cache_dir)
            if failure:
                failed_refs.append(failure)
                if kp_id not in seen_failed_kps:
                    seen_failed_kps.add(kp_id)
                    kps_with_failures.append(str(kp_id))

    report = {
        "allClean": not failed_refs,
        "totalUrls": total_urls,
        "okUrls": total_urls - len(failed_refs),
        "failedRefs": failed_refs,
        "kpsWithFailures": kps_with_failures,
    }
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return 0 if report["allClean"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
