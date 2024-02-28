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
        if [[ ${CF_PAGES_BRANCH} == preview/* ]]; then
            channels=C02RRV28VGX
        else
            channels=CJBEQQPFG
        fi
        curl -F file=@build.log -F "initial_comment=$filename" -F "channels=$channels" -H "Authorization: Bearer $SLACK_DEPLOYMENT_BOT_TOKEN" https://slack.com/api/files.upload
    fi
}

echo "Starting build..." > build.log
slack_message "*Building (${CF_PAGES_BRANCH}/${CF_PAGES_COMMIT_SHA}) of docs *"
exit() { slack_message "*Deployment (${CF_PAGES_BRANCH}/${CF_PAGES_COMMIT_SHA}/${CF_PAGES_URL}) of docs finished ${emoji}*\\\nConclusion: ${conclusion}"; }
conclusion="failure" emoji="💥"
trap exit EXIT


if [[ ${CF_PAGES_BRANCH} == preview/* ]]; then
    export SITE_URL="$CF_PAGES_URL"
fi

astro build 2>&1 | tee -a build.log

conclusion="success" emoji="🦾"
