const RANT_SERVICE_URL = process.env.RANT_SERVICE_URL || "http://rant-service:3002"
const ESCALATION_THRESHOLD = parseInt(process.env.ESCALATION_THRESHOLD || "10")

export async function checkAndEscalateRant(rantId: string, currentNetVotes: number) {
  if (currentNetVotes < ESCALATION_THRESHOLD) {
    return
  }

  try {
    const res = await fetch(`${RANT_SERVICE_URL}/internal/rants/${rantId}`)
    if (!res.ok) {
      console.error(`Failed to fetch rant ${rantId} for escalation check: status ${res.status}`)
      return
    }

    const rant = await res.json() as { status: string }

    if (rant.status === "open") {
      const updateRes = await fetch(`${RANT_SERVICE_URL}/internal/rants/${rantId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      })

      if (updateRes.ok) {
        console.log(`Successfully escalated rant ${rantId} to 'acknowledged'`)
      } else {
        console.error(`Failed to update rant ${rantId} status for escalation: status ${updateRes.status}`)
      }
    }
  } catch (e) {
    console.error("Error during auto-escalation check:", e)
  }
}
