import { createFileRoute } from "@tanstack/react-router";
import { adminAuth, adminDb } from "@/services/firebase-admin";

export const Route = createFileRoute("/api/public/resources")({
  server: {
    handlers: {
      GET: async () => {
        const snapshot = await adminDb.collection("resources").get();

        const resources = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return new Response(JSON.stringify(resources), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
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
          const userId = decodedToken.uid;

          // ------------------------------------------------------------
          // 2. Verify the user's Firestore role
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
          const role = userData?.["role"] as
            | "citizen"
            | "authority"
            | undefined;

          if (role !== "authority") {
            return new Response(
              JSON.stringify({
                error: "Authority access required",
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
          // 3. Read the resource update
          // ------------------------------------------------------------

          const body = (await request.json()) as {
            id?: string;
            patch?: Record<string, unknown>;
          };

          if (!body.id || !body.patch) {
            return new Response(
              JSON.stringify({
                error: "Resource id and patch are required.",
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
          // 4. Update the resource
          // ------------------------------------------------------------

          const resourcesRef = adminDb.collection("resources");

          const directDoc = await resourcesRef.doc(body.id).get();

          if (directDoc.exists) {
            await directDoc.ref.update(body.patch);
          } else {
            const querySnapshot = await resourcesRef
              .where("id", "==", body.id)
              .limit(1)
              .get();

            const resourceDoc = querySnapshot.docs[0];

            if (!resourceDoc) {
              return new Response(
                JSON.stringify({
                  error: "Resource not found.",
                }),
                {
                  status: 404,
                  headers: {
                    "Content-Type": "application/json",
                  },
                },
              );
            }

            await resourceDoc.ref.update(body.patch);
          }

          return new Response(
            JSON.stringify({
              id: body.id,
              ...body.patch,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {
          console.error("Failed to update resource:", error);

          return new Response(
            JSON.stringify({
              error: "Failed to update resource",
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