#!/bin/bash
set -e

SERVICE="dokguru-backend"
REGION="asia-south2"

echo "🔄 Starting automatic rollback..."

# Get the previous healthy revision (2nd newest)
PREVIOUS_REVISION=$(gcloud run revisions list \
  --service $SERVICE \
  --region $REGION \
  --sort-by="~createTime" \
  --format="value(name)" | sed -n '2p')

if [ -z "$PREVIOUS_REVISION" ]; then
  echo "❌ No previous revision found — cannot roll back."
  exit 1
fi

echo "↩️ Reverting traffic to previous revision: $PREVIOUS_REVISION"

# Route all traffic back to previous stable revision
gcloud run services update-traffic $SERVICE \
  --region $REGION \
  --to-revisions=${PREVIOUS_REVISION}=100

echo "🧹 Cleaning failed revision..."

# Delete or disable broken revision (optional, safe)
BROKEN_REVISION=$(gcloud run revisions list \
  --service $SERVICE \
  --region $REGION \
  --sort-by="~createTime" \
  --format="value(name)" | head -n 1)

if [ "$BROKEN_REVISION" != "$PREVIOUS_REVISION" ]; then
  gcloud run revisions delete $BROKEN_REVISION \
    --region $REGION \
    --quiet || true
fi

echo "✅ Rollback complete!"
