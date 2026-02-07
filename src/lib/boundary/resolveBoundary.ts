// src/lib/boundary/resolveBoundary.ts

import { BuildingSpace } from "@/types/spaces";
import { SystemInstance } from "@/types/systems";

export type Responsibility =
  | "Tenant"
  | "Landlord"
  | "Shared"
  | "OutOfScope";

export interface BoundaryResult {
  systemId: string;
  responsibility: Responsibility;
  reasoning: string;
}

export function resolveBoundaryForSystems(params: {
  systems: SystemInstance[];
  spaces: BuildingSpace[];
  tenantAccountId: string;
}): BoundaryResult[] {
  const { systems, spaces, tenantAccountId } = params;

  // 1. Identify tenant-controlled spaces IN SCOPE
  const tenantSpaceIds = new Set(
    spaces
      .filter(
        (s) =>
          s.spaceClass === "tenant" &&
          s.tenantAccountId === tenantAccountId &&
          s.inScope === true
      )
      .map((s) => s.id)
  );

  return systems.map((system) => {
    const servesBaseBuilding = system.servesSpaces.includes("base_building");

    const servesTenantSpaces = system.servesSpaces.some((spaceId) =>
      tenantSpaceIds.has(spaceId)
    );

    // 2. Decision tree (this is the "agent logic")

    if (!servesBaseBuilding && !servesTenantSpaces) {
      return {
        systemId: system.id,
        responsibility: "OutOfScope",
        reasoning:
          "System does not serve any tenant-controlled or in-scope spaces.",
      };
    }

    if (system.controlledBy === "Tenant" && servesTenantSpaces) {
      return {
        systemId: system.id,
        responsibility: "Tenant",
        reasoning:
          "System is tenant-controlled and serves only tenant spaces.",
      };
    }

    if (system.controlledBy === "Landlord" && servesBaseBuilding) {
      return {
        systemId: system.id,
        responsibility: "Landlord",
        reasoning:
          "System is landlord-controlled and serves base building/common areas.",
      };
    }

    if (
      system.controlledBy === "Landlord" &&
      servesTenantSpaces &&
      system.allocationMethod !== "direct"
    ) {
      return {
        systemId: system.id,
        responsibility: "Shared",
        reasoning:
          "Landlord-controlled system serves tenant spaces but requires allocation.",
      };
    }

    return {
      systemId: system.id,
      responsibility: "Shared",
      reasoning:
        "System spans landlord and tenant scope or has mixed control.",
    };
  });
}
