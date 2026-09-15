#!/usr/bin/env bash
set -euo pipefail

TAG_FILE="$(mktemp)"
cat > "$TAG_FILE" <<'EOF'
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DHR30T6FHP"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-DHR30T6FHP');
</script>
EOF

# Find all html files (skip common dependency/build dirs)
find . -type f \( -name "*.html" -o -name "*.htm" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -print0 | while IFS= read -r -d '' f; do

  # Skip if this exact GA property ID already exists in file
  if grep -q "G-DHR30T6FHP" "$f"; then
    echo "skip (already tagged): $f"
    continue
  fi

  # Insert right after first <head ...> (case-insensitive)
  awk -v tagfile="$TAG_FILE" '
    BEGIN { inserted=0; while ((getline line < tagfile) > 0) tag = tag line ORS; close(tagfile) }
    {
      print $0
      if (!inserted && tolower($0) ~ /<head[[:space:]>]/) {
        printf "%s", tag
        inserted=1
      }
    }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

  if grep -q "G-DHR30T6FHP" "$f"; then
    echo "updated: $f"
  else
    echo "warning (no <head> found?): $f"
  fi
done

rm -f "$TAG_FILE"
echo "Done."