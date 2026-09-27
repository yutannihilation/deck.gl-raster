import loadEPSG from "@developmentseed/epsg/all";
import type { ProjectionDefinition } from "./parse-wkt.js";
import { parseWkt } from "./parse-wkt.js";

/**
 * A global registry holding parsed projection definitions.
 */
export const PROJECTION_REGISTRY = new Map<string, ProjectionDefinition>();

export type EpsgResolver = (epsg: number) => Promise<ProjectionDefinition>;

export async function epsgResolver(epsg: number) {
  const key = `EPSG:${epsg}`;
  const cachedProj = PROJECTION_REGISTRY.get(key);
  if (cachedProj !== undefined) {
    return cachedProj;
  }

  const wkt = await getWkt(epsg);
  const proj = parseWkt(wkt);
  PROJECTION_REGISTRY.set(key, proj);

  return proj;
}

/** Look up the WKT for the given EPSG code in the bundled EPSG database. */
async function getWkt(epsg: number): Promise<string> {
  const db = await loadEPSG();
  const wkt = db.get(epsg);
  if (wkt === undefined) {
    throw new Error(`EPSG code ${epsg} not found in the bundled EPSG database`);
  }

  return wkt;
}
