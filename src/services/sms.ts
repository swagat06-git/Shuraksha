export interface OutboundSms {
  to: string;
  message: string;
}

export async function sendSms({
  to,
  message,
}: OutboundSms): Promise<void> {
  const response = await fetch("/api/public/twilio/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      message,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.error || `SMS request failed with status ${response.status}`,
    );
  }

  console.info("[sms] outbound notification sent", {
    to,
    messageSid: data.messageSid,
  });
}