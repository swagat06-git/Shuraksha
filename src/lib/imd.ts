export type ImdWarningLevel = 1 | 2 | 3 | 4;

export interface ImdWarning {
  district: string;
  hazard: string;
  level: ImdWarningLevel;
  validUntil: string;
  source: "IMD";
  demo: boolean;
}

export interface ImdDangerZone {
  district: string;
  center: [number, number];
  radiusKm: number;
}

export const IMD_DANGER_ZONES: ImdDangerZone[] = [
  {
    district: "Sundargarh",
    center: [22.125, 84.535],
    radiusKm: 5,
  },
];
export const IMD_WARNINGS: ImdWarning[] = [
  {
    district: "Sundargarh",
    hazard: "Heavy Rain",
    level: 3,
    validUntil: "Today",
    source: "IMD",
    demo: true,
  },
];

export function imdLevelLabel(level: ImdWarningLevel): string {
  switch (level) {
    case 1:
      return "No Warning";
    case 2:
      return "Watch";
    case 3:
      return "Alert";
    case 4:
      return "Warning";
  }
}

/*
 * ================================================================
 * FUTURE IMD API INTEGRATION
 * ================================================================
 *
 * CURRENT STATUS
 *
 * Shuraksha currently uses simulated IMD warning data because
 * access to live IMD warning APIs requires authorized registration
 * and API credentials.
 *
 * IMD provides official weather and district-wise warning APIs.
 * Once Shuraksha receives authorized access, we will replace the
 * simulated warning layer with official IMD warning data.
 *
 *
 * ================================================================
 * OUR PLANNED PRODUCTION IMPLEMENTATION
 * ================================================================
 *
 * 1. We will obtain authorized IMD API access and securely store
 *    the API credentials on the server.
 *
 * 2. We will create a server-side IMD integration that will fetch
 *    the latest official warning information.
 *
 * 3. We will keep the API key completely server-side so that it
 *    will never be exposed to the browser or client-side React code.
 *
 * 4. We will convert the official IMD response into Shuraksha's
 *    internal ImdWarning format:
 *
 *       {
 *         district: "...",
 *         hazard: "...",
 *         level: ...,
 *         validUntil: "...",
 *         source: "IMD",
 *         demo: false,
 *       }
 *
 * 5. We will use the geographical information supplied by IMD to
 *    identify the affected area.
 *
 *    When official polygon geometry is available, we will render
 *    the official affected area directly on the map.
 *
 *    When only a geographic center and affected radius are
 *    available, we will represent the warning as a circular zone.
 *
 * 6. We will display the official IMD warning as an additional
 *    layer on the existing Shuraksha authority map.
 *
 *    The map will combine:
 *
 *       IMD Warning Zone
 *       + Citizen Reports
 *       + Available Resources
 *       + Allocation Suggestions
 *
 * 7. We will use IMD warnings as an additional hazard signal for
 *    the resource-allocation system.
 *
 *    For example:
 *
 *       Official IMD Alert
 *              +
 *       Citizen reports inside the affected area
 *              +
 *       Incident severity
 *              +
 *       People requiring assistance
 *              |
 *              v
 *       Shuraksha Allocation Engine
 *              |
 *              v
 *       Best Available Resource
 *
 * 8. We will keep citizen reports as an independent real-time
 *    ground-level signal. IMD warnings will complement citizen
 *    reports rather than replace them.
 *
 * 9. We will add server-side caching/controlled refresh so that
 *    Shuraksha can receive updated warnings without repeatedly
 *    requesting the external IMD service from every browser.
 *
 * 10. We will handle IMD service failures gracefully. If the
 *     external service becomes temporarily unavailable, Shuraksha
 *     will continue operating with citizen reports, resources,
 *     shelters and the existing allocation engine.
 *
 *
 * ================================================================
 * FINAL PRODUCTION FLOW
 * ================================================================
 *
 *              Official IMD API
 *                     |
 *                     v
 *            Secure Server Integration
 *                     |
 *                     v
 *             Validate + Normalize
 *                     |
 *              +------+------+
 *              |             |
 *              v             v
 *        IMD Warning    Affected Area
 *              |             |
 *              +------+------+
 *                     |
 *                     v
 *              Shuraksha Map
 *                     |
 *        +------------+------------+
 *        |            |            |
 *        v            v            v
 *     IMD Zone    Citizen       Resources
 *                 Reports
 *                     |
 *                     v
 *             Allocation Engine
 *                     |
 *                     v
 *              Authority Action
 *
 *
 * The current demo implementation is therefore designed as a
 * replaceable IMD integration layer. Once authorized official
 * access becomes available, the simulated data will be replaced
 * by live IMD warnings without requiring a redesign of the
 * authority dashboard.
 */