#!/usr/bin/env python3
# This script counts the number of contributors for repositories over the last 30 days.
#
# A contributor is a user who contributed commits to a pull request in the last
# 30 days, either by opening it or by pushing commits to it. This matches how
# Mergify counts active users for billing.
#
# See https://docs.mergify.com/billing/ for context.
#
# Keep in mind that this is not 100% accurate but gives a ballpark estimate.
#
# You'll need Python 3 and requests for this to work.
# You can install requests by running:
# $ pip install requests
# then run this script with:
# $ python3 mergify-count-contributors <url of your repo>

import collections
import requests
import pprint
import os
from datetime import datetime, timedelta
from urllib.parse import urlparse

LOOKBACK_WINDOW = timedelta(days=30)
SINCE_DATE = datetime.now() - LOOKBACK_WINDOW

HEADERS = {
    "Authorization": f"token {os.environ.get('GITHUB_TOKEN')}",
    "Accept": "application/vnd.github.v3+json",
}


def get_api_and_repo_name_from_url(url):
    parsed = urlparse(url)
    if parsed.netloc.lower() == "github.com":
        host = "https://api.github.com"
    else:
        host = f"https://{parsed.netloc}/api/v3"

    return host, parsed.path.strip("/")


def _requests_get(*args, **kwargs):
    try:
        response = requests.get(
            *args,
            **kwargs,
        )
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        print("E: Unable to request GitHub: {e}")
        raise
    else:
        return response


def get_active_prs_for_repo(api_endpoint, repo_name):
    page = 1
    prs = []
    while True:
        try:
            response = _requests_get(
                f"{api_endpoint}/repos/{repo_name}/pulls",
                headers=HEADERS,
                params={
                    "state": "all",
                    "page": page,
                    "per_page": 100,
                    "sort": "created",
                    "direction": "desc",
                },
            )
            response.raise_for_status()
        except Exception:
            print("W: Unable to retrieve PR list, ignoring")
        else:
            # No more PR
            pr_list = response.json()
            for pr in pr_list:
                created_at = datetime.fromisoformat(pr["created_at"].rstrip("Z"))
                if created_at >= SINCE_DATE:
                    prs.append(pr)
                else:
                    return prs

            # Last page, quit
            if len(pr_list) < 100:
                return prs

            page += 1


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
        commits_response = _requests_get(
            f"{api_endpoint}/repos/{repo_name}/pulls/{pr['number']}/commits?per_page=100",
            headers=HEADERS,
        )
        commits_response.raise_for_status()
    except Exception:
        print("W: Unable to retrieve PR commits, ignoring")
    else:
        for commit in commits_response.json():
            for actor in (commit.get("author"), commit.get("committer")):
                if actor and not is_user_ignored(actor):
                    users.add(actor["login"])

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
    pprint.pprint(active_users_per_repo)

    unique_users = set().union(*active_users_per_repo.values())
    print("*** Unique users:")
    pprint.pprint(unique_users)
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
