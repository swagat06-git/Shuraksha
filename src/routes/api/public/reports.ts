import { createFileRoute } from "@tanstack/react-router";

import { getReports } from "@/services/firebase";

export const Route = createFileRoute("/api/public/reports")({
  server: {
    handlers: {
      GET: async () => {
        const reports = getReports();

        return Response.json(reports);
      },
    },
  },
});