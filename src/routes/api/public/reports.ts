import { createFileRoute } from "@tanstack/react-router";
import { adminAuth, adminDb } from "@/services/firebase-admin";
import { uploadReportPhoto } from "@/services/cloudinary";


export const Route = createFileRoute("/api/public/reports")({
    server: {
        handlers: {
            GET: async () => {
                const snapshot = await adminDb.collection("reports").get();

                const reports = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                return new Response(JSON.stringify(reports), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            },

            POST: async ({ request }) => {
                try {
                    // ------------------------------------------------------------
                    // 1. Verify Firebase Authentication
                    // ------------------------------------------------------------

                    const authorization = request.headers.get("Authorization");

                    if (!authorization?.startsWith("Bearer ")) {
                        return new Response(
                            JSON.stringify({
                                error: "Authentication required",
                            }),
                            {
                                status: 401,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const idToken = authorization.substring("Bearer ".length).trim();

                    if (!idToken) {
                        return new Response(
                            JSON.stringify({
                                error: "Authentication required",
                            }),
                            {
                                status: 401,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const decodedToken = await adminAuth.verifyIdToken(idToken);
                    const authenticatedUserId = decodedToken.uid;

                    // ------------------------------------------------------------
                    // 2. Read the report submitted by the client
                    // ------------------------------------------------------------

                    const formData = await request.formData();

                    const reportJson = formData.get("report");
                    const photo = formData.get("photo");

                    if (typeof reportJson !== "string") {
                        return new Response(
                            JSON.stringify({
                                error: "Report data is required",
                            }),
                            {
                                status: 400,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const report = JSON.parse(reportJson) as Record<string, unknown>;

                    let photoUrl: string | undefined;

                    if (photo instanceof File && photo.size > 0) {
                        if (!photo.type.startsWith("image/")) {
                            return new Response(
                                JSON.stringify({
                                    error: "Only image files are allowed",
                                }),
                                {
                                    status: 400,
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                },
                            );
                        }

                        if (photo.size > 5 * 1024 * 1024) {
                            return new Response(
                                JSON.stringify({
                                    error: "Photo must be 5 MB or smaller",
                                }),
                                {
                                    status: 400,
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                },
                            );
                        }

                        photoUrl = await uploadReportPhoto(photo);
                    }

                    // ------------------------------------------------------------
                    // 3. Never trust the client-provided userId.
                    //    The server determines the real owner.
                    // ------------------------------------------------------------

                    const secureReport = {
                        ...report,
                        userId: authenticatedUserId,
                        ...(photoUrl ? { photoUrl } : {}),
                    };

                    // ------------------------------------------------------------
                    // 4. Save the report
                    // ------------------------------------------------------------

                    const docRef = await adminDb
                        .collection("reports")
                        .add(secureReport);

                    return new Response(
                        JSON.stringify({
                            id: docRef.id,
                            ...secureReport,
                        }),
                        {
                            status: 201,
                            headers: {
                                "Content-Type": "application/json",
                            },
                        },
                    );
                } catch (error) {
                    console.error("Failed to create report:", error);

                    return new Response(
                        JSON.stringify({
                            error: "Failed to create report",
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

            PATCH: async ({ request }) => {
                try {
                    // ------------------------------------------------------------
                    // 1. Verify Firebase Authentication
                    // ------------------------------------------------------------

                    const authorization = request.headers.get("Authorization");

                    if (!authorization?.startsWith("Bearer ")) {
                        return new Response(
                            JSON.stringify({
                                error: "Authentication required",
                            }),
                            {
                                status: 401,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const idToken = authorization.substring("Bearer ".length).trim();

                    if (!idToken) {
                        return new Response(
                            JSON.stringify({
                                error: "Authentication required",
                            }),
                            {
                                status: 401,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const decodedToken = await adminAuth.verifyIdToken(idToken);
                    const userId: string = decodedToken.uid;

                    // ------------------------------------------------------------
                    // 2. Load the user's Firestore profile and role
                    // ------------------------------------------------------------

                    const userDoc = await adminDb
                        .collection("users")
                        .doc(userId)
                        .get();

                    if (!userDoc.exists) {
                        return new Response(
                            JSON.stringify({
                                error: "User profile not found",
                            }),
                            {
                                status: 403,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const userData = userDoc.data();
                    const role = userData?.["role"] as "citizen" | "authority" | undefined;

                    if (role !== "citizen" && role !== "authority") {
                        return new Response(
                            JSON.stringify({
                                error: "Invalid user role",
                            }),
                            {
                                status: 403,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    // ------------------------------------------------------------
                    // 3. Read PATCH request
                    // ------------------------------------------------------------

                    const body = (await request.json()) as {
                        id?: string;
                        patch?: Record<string, unknown>;
                    };

                    if (!body.id || !body.patch) {
                        return new Response(
                            JSON.stringify({
                                error: "id and patch are required",
                            }),
                            {
                                status: 400,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    // ------------------------------------------------------------
                    // 4. Find the report
                    // ------------------------------------------------------------

                    const querySnapshot = await adminDb
                        .collection("reports")
                        .where("id", "==", body.id)
                        .limit(1)
                        .get();

                    if (querySnapshot.empty) {
                        return new Response(
                            JSON.stringify({
                                error: "Report not found",
                            }),
                            {
                                status: 404,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const reportDoc = querySnapshot.docs[0];

                    if (!reportDoc) {
                        return new Response(
                            JSON.stringify({
                                error: "Report not found",
                            }),
                            {
                                status: 404,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    const report = reportDoc.data();

                    // ------------------------------------------------------------
                    // 5. Citizens can only update their own reports
                    // ------------------------------------------------------------

                    if (role === "citizen" && report["userId"] !== userId) {
                        return new Response(
                            JSON.stringify({
                                error: "You can only update your own reports",
                            }),
                            {
                                status: 403,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    // ------------------------------------------------------------
                    // 6. Limit which fields each role can modify
                    // ------------------------------------------------------------

                    const requestedFields = Object.keys(body.patch);

                    const citizenAllowedFields = new Set([
                        "citizenStatus",
                    ]);

                    const authorityAllowedFields = new Set([
                        "status",
                        "citizenStatus",
                        "assignedResourceId",
                        "assignedEvacuationResourceId",
                    ]);

                    const allowedFields =
                        role === "authority"
                            ? authorityAllowedFields
                            : citizenAllowedFields;

                    const invalidFields = requestedFields.filter(
                        (field) => !allowedFields.has(field),
                    );

                    if (invalidFields.length > 0) {
                        return new Response(
                            JSON.stringify({
                                error: "You are not allowed to modify these fields",
                                fields: invalidFields,
                            }),
                            {
                                status: 403,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                    }

                    // ------------------------------------------------------------
                    // 7. Update the report
                    // ------------------------------------------------------------

                    const updatedAt = Date.now();

                    await reportDoc.ref.update({
                        ...body.patch,
                        updatedAt,
                    });

                    return new Response(
                        JSON.stringify({
                            id: body.id,
                            ...body.patch,
                            updatedAt,
                        }),
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                            },
                        },
                    );
                } catch (error) {
                    console.error("PATCH /api/public/reports failed:", error);

                    return new Response(
                        JSON.stringify({
                            error: "Failed to update report",
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