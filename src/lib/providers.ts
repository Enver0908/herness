export type SendMessageInput = {
  body: string;
  channel: "WhatsApp" | "Email";
  recipient: string;
  subject?: string;
};

export type SendMessageResult = {
  provider: string;
  providerMessageId?: string;
  status: "sent" | "failed" | "simulated";
};

export async function sendOutboundMessage(input: SendMessageInput): Promise<SendMessageResult> {
  if (input.channel === "WhatsApp") {
    return sendWhatsAppMessage(input);
  }

  return sendEmailMessage(input);
}

export async function sendWhatsAppMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return {
      provider: "simulated_whatsapp",
      providerMessageId: `sim-wa-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: "simulated",
    };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.recipient,
      type: "text",
      text: { body: input.body, preview_url: false },
    }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  const payload = await response.json().catch(() => ({})) as { messages?: { id?: string }[] };

  if (!response.ok) {
    throw new Error(`WhatsApp outbound failed: ${response.status}`);
  }

  return {
    provider: "meta_whatsapp_cloud_api",
    providerMessageId: payload.messages?.[0]?.id,
    status: "sent",
  };
}

export async function sendEmailMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return {
      provider: "simulated_email",
      providerMessageId: `sim-mg-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: "simulated",
    };
  }

  const formData = new FormData();
  formData.set("from", `HostOps CZ <hostops@${domain}>`);
  formData.set("to", input.recipient);
  formData.set("subject", input.subject ?? "Your stay");
  formData.set("text", input.body);

  const response = await fetch(`https://api.eu.mailgun.net/v3/${domain}/messages`, {
    body: formData,
    headers: {
      authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
    },
    method: "POST",
  });

  const payload = await response.json().catch(() => ({})) as { id?: string };

  if (!response.ok) {
    throw new Error(`Mailgun outbound failed: ${response.status}`);
  }

  return {
    provider: "mailgun_eu_inbound",
    providerMessageId: payload.id,
    status: "sent",
  };
}
