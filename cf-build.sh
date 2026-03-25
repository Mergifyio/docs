#!/bin/bash

set -e
set -o pipefail

slack_message () {
    local message="$1"
    local filename="docs-build-${CF_PAGES_COMMIT_SHA}.log"

    local payload=$(
cat <<SLACK_EOF
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "${message}"
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Cloudflare log",
          "emoji": true
        },
        "url": "https://dash.cloudflare.com/799c85a11fd788c9c914fa97c52d971e/pages/view/docs-cf-prod"
      }
    }
  ]
}
SLACK_EOF
)
    echo -en "$payload" | curl -s -H "Content-type: application/json" -d @- "$SLACK_DEPLOYMENT_WEBHOOK_URL_RELEASES"
    if [ "$conclusion" == "failure" ]; then
        echo -en "$payload" | curl -s -H "Content-type: application/json" -d @- "$SLACK_DEPLOYMENT_WEBHOOK_URL_PROD"
        if [[ ${CF_PAGES_BRANCH} == main ]]; then
            channels=CJBEQQPFG
        else
            channels=C02RRV28VGX
        fi
        curl -F file=@build.log -F "initial_comment=$filename" -F "channels=$channels" -H "Authorization: Bearer $SLACK_DEPLOYMENT_BOT_TOKEN" https://slack.com/api/files.upload
    fi
}

echo "Starting build..." > build.log
slack_message "*Building (${CF_PAGES_BRANCH}/${CF_PAGES_COMMIT_SHA}) of docs *"
exit() { slack_message "*Deployment (${CF_PAGES_BRANCH}/${CF_PAGES_COMMIT_SHA}/${CF_PAGES_URL}) of docs finished ${emoji}*\\\nConclusion: ${conclusion}"; }
conclusion="failure" emoji="💥"
trap exit EXIT

# For any non-main branch, use the Cloudflare preview URL as SITE_URL so absolute links (canonical, og:image, etc.)
# point to the correct preview host instead of the production domain.
if [[ ${CF_PAGES_BRANCH} != main && -n "$CF_PAGES_URL" ]]; then
  export SITE_URL="$CF_PAGES_URL"
fi

astro build 2>&1 | tee -a build.log

# Add Last-Modified headers for JSON schema files to fix check-jsonschema caching
# See: https://github.com/Mergifyio/mergify/issues/5161
for schema in mergify-configuration-schema.json api-schemas.json; do
  if [ -f "dist/$schema" ]; then
    # Try file-specific date first; fall back to HEAD date (for shallow clones).
    # Use %ct (unix timestamp) + date -u to produce RFC 1123 (HTTP-date) in GMT.
    # Non-fatal (|| true) to avoid breaking the deploy if git metadata is missing.
    ts=$(git log -1 --format="%ct" -- "public/$schema" 2>/dev/null || true)
    if [ -z "$ts" ]; then
      ts=$(git log -1 --format="%ct" 2>/dev/null || true)
    fi
    if [ -n "$ts" ]; then
      last_modified=$(date -u -d "@$ts" +"%a, %d %b %Y %H:%M:%S GMT")
      printf "\n/%s\n  Last-Modified: %s\n" "$schema" "$last_modified" >> dist/_headers
    fi
  fi
done

conclusion="success" emoji="🦾"
