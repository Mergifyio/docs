#!/usr/bin/env python3
"""Extract YAML/yml fenced code blocks from MDX docs and classify each.

Pure stdlib. Does NOT validate — it locates every YAML snippet, records its
file:line, and classifies it so the caller knows which snippets to feed to
`mergify config validate` and which to skip.

Usage:
    extract_yaml.py <file_or_dir> [<file_or_dir> ...]

If a directory is given, all .mdx files under it are scanned recursively.
Outputs a JSON array to stdout:
    [{"file", "line", "lang", "classification", "code"}, ...]

Classifications:
    mergify-config  -> a Mergify config; validate it with `mergify config validate`
    github-actions  -> a CI workflow, not Mergify config; skip
    partial         -> explicitly marked `# partial` or a fragment; skip validation
    unknown         -> YAML that is none of the above; review manually
"""

import json
import os
import re
import sys

FENCE_RE = re.compile(r"^([ \t]*)(`{3,}|~{3,})([^\n`]*)$")

# Top-level keys that mark a full Mergify configuration file.
MERGIFY_TOP_KEYS = {
    "queue_rules",
    "pull_request_rules",
    "merge_protections",
    "commands_restrictions",
    "merge_queue",
    "shared",
    "defaults",
    "extends",
    "partition_rules",
    "priority_rules",
}

# Signals that a YAML block is a GitHub Actions / CI workflow, not Mergify config.
CI_SIGNALS = ("runs-on:", "uses:", "jobs:", "steps:")


def lang_of(info_string):
    """First token of a fence info string, lowercased (e.g. 'yaml title=...')."""
    token = info_string.strip().split()[0] if info_string.strip() else ""
    # Strip a leading '{' from formats like ```{yaml}
    return token.lstrip("{").rstrip("}").lower()


def classify(code):
    lines = code.splitlines()
    stripped = [ln for ln in lines if ln.strip() and not ln.lstrip().startswith("#")]

    # Explicit author marker wins.
    for ln in lines[:3]:
        if re.match(r"^\s*#\s*partial\b", ln, re.IGNORECASE):
            return "partial"

    text = "\n".join(lines)
    if any(sig in text for sig in CI_SIGNALS) and "on:" in text:
        return "github-actions"

    top_keys = set()
    for ln in lines:
        m = re.match(r"^([A-Za-z_][\w-]*):", ln)
        if m:
            top_keys.add(m.group(1))
    if top_keys & MERGIFY_TOP_KEYS:
        return "mergify-config"

    # No unindented top-level key at all -> a fragment (e.g. a single rule shown
    # inline). Treat as partial: not independently validatable.
    if stripped and all(ln.startswith((" ", "\t", "-")) for ln in stripped):
        return "partial"

    return "unknown"


def extract_from_file(path):
    out = []
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()

    i = 0
    n = len(lines)
    while i < n:
        m = FENCE_RE.match(lines[i].rstrip("\n"))
        if not m:
            i += 1
            continue
        indent, fence, info = m.group(1), m.group(2), m.group(3)
        lang = lang_of(info)
        fence_line = i + 1  # 1-based
        # Find closing fence: same marker char, at least as long, no info string.
        body = []
        j = i + 1
        closed = False
        while j < n:
            cm = FENCE_RE.match(lines[j].rstrip("\n"))
            if cm and cm.group(2)[0] == fence[0] and len(cm.group(2)) >= len(fence) and not cm.group(3).strip():
                closed = True
                break
            body.append(lines[j].rstrip("\n"))
            j += 1
        if lang in ("yaml", "yml"):
            # Strip the common fence indentation from the body.
            code = "\n".join(ln[len(indent):] if ln.startswith(indent) else ln for ln in body)
            out.append(
                {
                    "file": path,
                    "line": fence_line,
                    "lang": lang,
                    "classification": classify(code),
                    "code": code,
                }
            )
        i = j + 1 if closed else j
    return out


def iter_targets(args):
    for arg in args:
        if os.path.isdir(arg):
            for root, _, files in os.walk(arg):
                for f in files:
                    if f.endswith(".mdx"):
                        yield os.path.join(root, f)
        elif arg.endswith(".mdx"):
            yield arg


def main(argv):
    if not argv:
        print(__doc__, file=sys.stderr)
        return 2
    results = []
    for path in iter_targets(argv):
        results.extend(extract_from_file(path))
    json.dump(results, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
