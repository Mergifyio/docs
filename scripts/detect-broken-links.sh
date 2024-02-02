#!/bin/bash

# NOTE(leo): script detects broken links by checking if internal
# ones match a .mdx file with correct path, and checks the status
# code of the response for http ones.

ignore_list=(
  "/api"  # api is not served by astro
)

verify_link() {
  error=0

  while read -r line; do
    file=$(echo "$line" | grep -oE '.*\.mdx')
    link=$(echo "$line" | cut -d '(' -f2 | cut -d ')' -f1)

    ignoring=0
    for ignored in "${ignore_list[@]}"; do
      if [[ $ignored =~ $link ]]; then
        ignoring=1
        break
      fi
    done

    if [[ $ignoring -eq 1 ]]; then
        continue
    fi

    # test internal links
    if [[ $link =~ ^/ ]]; then
      # remove potential trailing slash and hash part
      link=$(echo "$link" | grep -oE "^[^#]+" | sed "s:/$::")

      # check if the file exists (sometimes it is an index)
      if ! [[ $(find src/content/docs -type f -wholename "src/content/docs$link.mdx" -o -wholename "src/content/docs$link/index.mdx") ]]; then
        echo "- Internal link broken '$link' in file '$file'"
        error=1
      fi

    # test external links
    elif [[ $link =~ ^http ]]; then
      status_code=$(curl -s -o /dev/null -w "%{http_code}" -I "$link")

      if [[ $status_code == 000 || $status_code -ge 400 && $status_code -lt 500 ]]; then
        echo "- Http link '$link' in file '$file' is broken (status_code=$status_code)"
        error=1
      fi
    fi
  done

  return $error
}

# Get links in .mdx files
links=$(grep -ro --include "*.mdx" -E "\[.*\w+\.*]\((https?://.*|/.*)\)" src/content/docs | sort -u)

echo "** Start links validity check **"
verify_link <<<"$links"
return_status=$?
echo "** End links validity check **"

exit $return_status
