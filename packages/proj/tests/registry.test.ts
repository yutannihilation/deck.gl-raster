import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import proj4 from "proj4";
import { describe, expect, it, vi } from "vitest";
import { epsgResolver, PROJECTION_REGISTRY } from "../src/index.js";

// Node's fetch does not support file:// URLs, so we stub it to read the
// bundled EPSG database from disk.
const csvGzPath = resolve(import.meta.dirname, "../../epsg/src/all.csv.gz");
const fetchStub = vi.fn(async () => new Response(readFileSync(csvGzPath)));
vi.stubGlobal("fetch", fetchStub);

describe("epsgResolver", () => {
  it("resolves EPSG:4326 from the bundled database", async () => {
    const def = await epsgResolver(4326);
    expect(def.projName).toBe("longlat");
    expect(def.units).toBe("degree");
  });

  it("resolves EPSG:32610 (UTM zone 10N) to a working projection", async () => {
    const def = await epsgResolver(32610);

    // @ts-expect-error - proj4 typings are incomplete and don't support
    // wkt-parser input
    const [x, y] = proj4("EPSG:4326", def).forward([-123, 0]);
    expect(x).toBeCloseTo(500000, 3);
    expect(y).toBeCloseTo(0, 3);
  });

  it("caches parsed definitions and loads the database only once", async () => {
    await epsgResolver(3857);
    expect(PROJECTION_REGISTRY.has("EPSG:3857")).toBe(true);
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("throws for codes missing from the database", async () => {
    await expect(epsgResolver(999999)).rejects.toThrow(
      "EPSG code 999999 not found",
    );
  });
});
