#!/bin/bash

set -e

SERVICE="dokguru-backend"
REGION="asia-south2"
IMAGE="asia-south2-docker.pkg.dev/project-ef045ea2-1f6e-46ec-9d7/dokguru-backend-repo/dokguru-backend:latest"

echo "🚀 Deploying new revision (no traffic)..."
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --no-traffic \
  --quiet

NEW_REV=$(gcloud run services describe $SERVICE \
  --region $REGION \
  --format="value(status.latestCreatedRevisionName)")

echo "🔍 New revision created: $NEW_REV"

# Get URL of new revision
URL=$(gcloud run revisions describe $NEW_REV \
  --region $REGION \
  --format="value(status.address.url)")

echo "⏳ Running health checks..."

TRIES=10
SLEEP=5
HEALTHY=false

for ((i=1; i<=$TRIES; i++)); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health")
    echo "  Attempt $i/$TRIES → HTTP $STATUS"
    
    if [ "$STATUS" -eq 200 ]; then
        HEALTHY=true
        break
    fi

    sleep $SLEEP
done

if [ "$HEALTHY" = true ]; then
    echo "✅ Health check passed! Promoting revision → 100% traffic"

    gcloud run services update-traffic $SERVICE \
      --region $REGION \
      --to-revisions="$NEW_REV=100" \
      --quiet

    echo "🎉 Deployment complete and promoted."
else
    echo "❌ Health check FAILED. Rolling back..."

    # Get current stable revision (the one serving traffic)
    CURRENT_STABLE=$(gcloud run services describe $SERVICE \
      --region $REGION \
      --format="value(status.traffic[0].revisionName)")

    echo "➡️ Restoring traffic back to previous revision: $CURRENT_STABLE"

    gcloud run services update-traffic $SERVICE \
      --region $REGION \
      --to-revisions="$CURRENT_STABLE=100" \
      --quiet

    echo "🗑️ Deleting failed revision: $NEW_REV"
    gcloud run revisions delete $NEW_REV \
      --region $REGION \
      --quiet

    echo "♻️ Rollback complete. Your production remains unchanged."
fi
