#!/usr/bin/env python3
# This script counts the number of contributors for repositories over the last 30 days.
#
# A contributor is a user who contributed commits to a pull request in the last
# 30 days, either by opening it or by pushing commits to it. This matches how
# Mergify counts active users for billing.
#
# It works with both GitHub.com and GitHub Enterprise Server (GHES): the API
# endpoint is derived automatically from each repository URL you pass.
#
# See https://docs.mergify.com/billing/ for context.
#
# Keep in mind that this is not 100% accurate but gives a ballpark estimate.
#
# You'll need Python 3 and requests for this to work.
# You can install requests by running:
# $ pip install requests
# then run this script with:
# $ python3 mergify-count-contributors.py <url of your repo>
#
# Environment variables:
# - GITHUB_TOKEN: a token that can read the repositories (required).
# - GITHUB_SKIP_SSL_VERIFY: set to "1" to disable TLS certificate verification.
#   Useful for GHES installations that serve a self-signed or internal-CA
#   certificate. Disabling verification is insecure; prefer trusting the CA.

import collections
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import requests
from urllib3.exceptions import InsecureRequestWarning

LOOKBACK_WINDOW = timedelta(days=30)
# GitHub timestamps are in UTC, so compare against an explicit UTC "now".
SINCE_DATE = datetime.now(timezone.utc) - LOOKBACK_WINDOW

HEADERS = {
    "Authorization": f"token {os.environ.get('GITHUB_TOKEN')}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

# GHES installations commonly use a self-signed or internal-CA certificate. Let
# users opt out of TLS verification when they cannot install the CA locally.
VERIFY_SSL = os.environ.get("GITHUB_SKIP_SSL_VERIFY", "").lower() not in (
    "1",
    "true",
    "yes",
)
if not VERIFY_SSL:
    # Only silence the "insecure request" warning, so other warnings still surface.
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)  # type: ignore[attr-defined]


def get_api_and_repo_name_from_url(url):
    """Derive the REST API endpoint and "owner/repo" name from a repository URL.

    Supports github.com, GitHub Enterprise Cloud with data residency
    (``*.ghe.com``), and GitHub Enterprise Server (any other host, served under
    ``/api/v3``).
    """
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    scheme = parsed.scheme or "https"

    if host in ("github.com", "www.github.com"):
        api_endpoint = "https://api.github.com"
    elif host.endswith(".ghe.com"):
        # GitHub Enterprise Cloud with data residency.
        api_endpoint = f"{scheme}://api.{host}"
    else:
        # GitHub Enterprise Server: the REST API lives under /api/v3.
        api_endpoint = f"{scheme}://{parsed.netloc}/api/v3"

    return api_endpoint, parsed.path.strip("/")


def _requests_get(*args, **kwargs):
    kwargs.setdefault("headers", HEADERS)
    kwargs.setdefault("verify", VERIFY_SSL)
    try:
        response = requests.get(*args, **kwargs)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        print(f"E: Unable to request GitHub: {e}")
        raise
    else:
        return response


def _iter_pages(url, params=None):
    """Yield items page by page, incrementing ``page`` until a short page is returned."""
    params = dict(params or {})
    params.setdefault("per_page", 100)
    page = 1
    while True:
        params["page"] = page
        response = _requests_get(url, params=params)
        items = response.json()
        yield from items
        # Stop once a short page is returned: there is nothing left to fetch.
        if len(items) < params["per_page"]:
            return
        page += 1


def get_active_prs_for_repo(api_endpoint, repo_name):
    prs = []
    try:
        pulls = _iter_pages(
            f"{api_endpoint}/repos/{repo_name}/pulls",
            params={"state": "all", "sort": "created", "direction": "desc"},
        )
        for pr in pulls:
            created_at = datetime.fromisoformat(
                pr["created_at"].replace("Z", "+00:00")
            )
            if created_at >= SINCE_DATE:
                prs.append(pr)
            else:
                # PRs are sorted newest first: once we cross the window, stop.
                break
    except Exception as e:
        print(f"W: Unable to retrieve PR list, ignoring: {e}")
    return prs


def is_user_ignored(user):
    """Determine if a user should be ignored (bots, system users)."""
    return (
        user["id"] <= 0
        or user["login"].endswith("[bot]")
        or user["type"] == "Bot"
        or user["login"] == "web-flow"
    )


def get_users_from_pr(api_endpoint, repo_name, pr):
    """Extract the billable users from a PR: its author and the users who pushed commits to it."""
    users = set()

    # The PR author (counted when the pull request is opened).
    user = pr["user"]
    if not is_user_ignored(user):
        users.add(user["login"])

    # The users who pushed commits to the PR. Mergify bills the pusher on each
    # push; the commit author and committer are the closest proxy available
    # from the API.
    try:
        commits = _iter_pages(
            f"{api_endpoint}/repos/{repo_name}/pulls/{pr['number']}/commits"
        )
        for commit in commits:
            for actor in (commit.get("author"), commit.get("committer")):
                if actor and not is_user_ignored(actor):
                    users.add(actor["login"])
    except Exception as e:
        print(f"W: Unable to retrieve PR commits, ignoring: {e}")

    return users


def main(repos):
    """Main function to fetch active users per repository."""
    active_users_per_repo = collections.defaultdict(set)

    for api_endpoint, repo in (get_api_and_repo_name_from_url(url) for url in repos):
        print(f"Getting active PRs for {repo}")
        active_prs = get_active_prs_for_repo(api_endpoint, repo)
        nb_active_prs = len(active_prs)
        print(f" -> Found {nb_active_prs} PRs since {SINCE_DATE}")
        for i, pr in enumerate(active_prs):
            print(
                f"  -> Retrieving contributors for #{pr['number']} {i + 1}/{nb_active_prs}"
            )
            active_users_per_repo[repo] |= get_users_from_pr(api_endpoint, repo, pr)

    print(f"Active users since {SINCE_DATE}:")
    for repo, users in active_users_per_repo.items():
        print(f"  {repo}: {sorted(users)}")

    unique_users = set()
    for users in active_users_per_repo.values():
        unique_users |= users
    print("*** Unique users:")
    print(f"  {sorted(unique_users)}")
    print(f"*** Total unique users: {len(unique_users)}")


if __name__ == "__main__":
    import sys

    if not os.environ.get("GITHUB_TOKEN"):
        print("Please set the GITHUB_TOKEN environment variable.")
        print("Go to https://github.com/settings/tokens to create a token.")
        sys.exit(1)

    if len(sys.argv) <= 1:
        print(f"Usage: {sys.argv[0]} <repo-url1> <repo-url2> ...")
        sys.exit(2)

    main(sys.argv[1:])
