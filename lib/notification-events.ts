import { SupabaseClient } from "@supabase/supabase-js";

type EventInput = {
  businessId: string;
  feedbackId?: string | null;
  eventType: "complaint_alert" | "weekly_summary";
  channel: "whatsapp" | "email" | "none";
  status: "sent" | "failed" | "skipped";
  error?: string | null;
};

export async function recordNotificationEvent(
  supabase: SupabaseClient,
  input: EventInput
) {
  const { error } = await supabase.from("notification_events").insert({
    business_id: input.businessId,
    feedback_id: input.feedbackId ?? null,
    event_type: input.eventType,
    channel: input.channel,
    status: input.status,
    error: input.error ?? null,
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("[notification_events] insert error:", error.message);
  }
}
