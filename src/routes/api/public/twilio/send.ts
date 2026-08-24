import { createFileRoute } from "@tanstack/react-router";
import twilio from "twilio";

export const Route = createFileRoute("/api/public/twilio/send")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const accountSid = process.env.TWILIO_ACCOUNT_SID;
                    const authToken = process.env.TWILIO_AUTH_TOKEN;
                    const from = process.env.TWILIO_PHONE_NUMBER;
                    const defaultTo = process.env.TWILIO_TEST_TO;

                    if (!accountSid || !authToken || !from) {
                        return new Response(
                            JSON.stringify({
                                success: false,
                                error: "Twilio server configuration is missing.",
                            }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const body = await request.json().catch(() => ({}));

                    const to =
                        typeof body.to === "string" && body.to.trim()
                            ? body.to.trim()
                            : defaultTo;

                    const message =
                        typeof body.message === "string" && body.message.trim()
                            ? body.message.trim()
                            : "Shuraksha emergency notification: Please check the operations console.";
                    const smsBody =
                        process.env.TWILIO_TRIAL_TEMPLATE || message;

                    if (!to) {
                        return new Response(
                            JSON.stringify({
                                success: false,
                                error: "No recipient phone number was provided.",
                            }),
                            {
                                status: 400,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const client = twilio(accountSid, authToken);

                    const result = await client.messages.create({
                        body: smsBody,
                        from,
                        to,
                    });

                    return new Response(
                        JSON.stringify({
                            success: true,
                            messageSid: result.sid,
                        }),
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                            },
                        },
                    );
                } catch (error) {
                    console.error("Twilio outbound SMS error:", error);

                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }),
                        {
                            status: 500,
                            headers: {
                                "Content-Type": "application/json",
                            },
                        },
                    );
                }
            },
        },
    },
});