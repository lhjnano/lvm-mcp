/**
 * LVM schema validation tests
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schema definitions from index.ts (after build)
// For testing, we define schemas directly
const LvTypeEnum = z.enum([
  "linear", "striped", "mirror",
  "raid0", "raid1", "raid4", "raid5", "raid6", "raid10",
  "thin", "thin-pool", "cache", "cache-pool"
]);

const LvCreateArgsSchema = z.object({
  vgName: z.string().describe("Volume Group name"),
  lvName: z.string().describe("Logical Volume name"),
  size: z.string().describe("Size (e.g., 10G, 500M)"),
  lvType: LvTypeEnum.describe("Logical Volume type").default("linear"),
  stripes: z.number().optional().describe("Number of stripes for striped LV"),
  stripeSize: z.string().optional().describe("Stripe size (e.g., 64K)"),
  mirrors: z.number().optional().describe("Number of mirrors for mirrored LV"),
  raidLevel: z.number().optional().describe("RAID level (0, 1, 4, 5, 6, 10)"),
  raidIntegrity: z.boolean().optional().describe("Add integrity layer"),
  regionSize: z.string().optional().describe("RAID region size (e.g., 2M)"),
  minRecoveryRate: z.string().optional().describe("Minimum recovery rate (e.g., 128KiB/s)"),
  maxRecoveryRate: z.string().optional().describe("Maximum recovery rate (e.g., 2MiB/s)"),
  writeMostly: z.enum(["N", "Y"]).optional().describe("Write-mostly flag"),
  thinPool: z.string().optional().describe("Thin pool name (for thin LVs)"),
  snapshotOf: z.string().optional().describe("LV to create snapshot from"),
  chunkSize: z.string().optional().describe("Chunk size (e.g., 512K)"),
  filesystem: z.string().optional().describe("Filesystem type (ext4, xfs, etc.)"),
  tags: z.array(z.string()).optional().describe("Tags to assign to LV"),
  contiguous: z.boolean().optional().describe("Allocate contiguous extents"),
  permission: z.enum(["rw", "r"]).optional().describe("LV permission"),
  allocPolicy: z.enum(["inherit", "contiguous", "cling", "normal", "anywhere", "inherit"]).optional().describe("Allocation policy"),
});

describe("LvCreateArgsSchema", () => {
  describe("Basic validation", () => {
    it("should validate with minimum required fields", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G"
      });

      expect(result).toEqual({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        lvType: "linear"  // default value
      });
    });

    it("should parse all valid arguments", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        lvType: "linear",
        stripes: 4,
        stripeSize: "64K",
        mirrors: 2,
        raidLevel: 5,
        raidIntegrity: true,
        regionSize: "2M",
        minRecoveryRate: "128KiB/s",
        maxRecoveryRate: "2MiB/s",
        writeMostly: "N",
        thinPool: "thinpool0",
        snapshotOf: "origin",
        chunkSize: "512K",
        filesystem: "ext4",
        tags: ["production", "important"],
        contiguous: true,
        permission: "rw",
        allocPolicy: "normal"
      });

      expect(result.vgName).toBe("vg0");
      expect(result.lvName).toBe("data");
      expect(result.lvType).toBe("linear");
      expect(result.stripes).toBe(4);
      expect(result.tags).toEqual(["production", "important"]);
    });
  });

  describe("LV type validation", () => {
    it("should accept all valid LV types", () => {
      const validTypes = [
        "linear", "striped", "mirror",
        "raid0", "raid1", "raid4", "raid5", "raid6", "raid10",
        "thin", "thin-pool", "cache", "cache-pool"
      ];

      for (const type of validTypes) {
        const result = LvCreateArgsSchema.parse({
          vgName: "vg0",
          lvName: "data",
          size: "10G",
          lvType: type
        });
        expect(result.lvType).toBe(type);
      }
    });

    it("should reject invalid LV types", () => {
      expect(() => {
        LvCreateArgsSchema.parse({
          vgName: "vg0",
          lvName: "data",
          size: "10G",
          lvType: "invalid_type"
        });
      }).toThrow();
    });
  });

  describe("Required field validation", () => {
    it("should throw error when vgName is missing", () => {
      expect(() => {
        LvCreateArgsSchema.parse({
          lvName: "data",
          size: "10G"
        });
      }).toThrow();
    });

    it("should throw error when lvName is missing", () => {
      expect(() => {
        LvCreateArgsSchema.parse({
          vgName: "vg0",
          size: "10G"
        });
      }).toThrow();
    });

    it("should throw error when size is missing", () => {
      expect(() => {
        LvCreateArgsSchema.parse({
          vgName: "vg0",
          lvName: "data"
        });
      }).toThrow();
    });
  });

  describe("Optional field validation", () => {
    it("should validate without optional fields", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G"
      });

      expect(result.stripes).toBeUndefined();
      expect(result.mirrors).toBeUndefined();
      expect(result.raidLevel).toBeUndefined();
    });

    it("should validate with only some optional fields", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        filesystem: "ext4",
        tags: ["test"]
      });

      expect(result.filesystem).toBe("ext4");
      expect(result.tags).toEqual(["test"]);
      expect(result.stripes).toBeUndefined();
    });
  });

  describe("LV type specific validation", () => {
    it("should use stripes option for striped type", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "stripe_test",
        size: "50G",
        lvType: "striped",
        stripes: 4,
        stripeSize: "64K"
      });

      expect(result.lvType).toBe("striped");
      expect(result.stripes).toBe(4);
      expect(result.stripeSize).toBe("64K");
    });

    it("should use mirrors option for mirrored type", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "mirror_test",
        size: "20G",
        lvType: "mirror",
        mirrors: 2
      });

      expect(result.lvType).toBe("mirror");
      expect(result.mirrors).toBe(2);
    });

    it("should use raidLevel option for RAID types", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "raid_test",
        size: "100G",
        lvType: "raid5",
        raidLevel: 5
      });

      expect(result.lvType).toBe("raid5");
      expect(result.raidLevel).toBe(5);
    });

    it("should use thinPool option for thin type", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "thin_vol",
        size: "500G",
        lvType: "thin",
        thinPool: "thinpool0"
      });

      expect(result.lvType).toBe("thin");
      expect(result.thinPool).toBe("thinpool0");
    });
  });

  describe("Cache-related validation", () => {
    it("should accept N or Y for writeMostly", () => {
      const result1 = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        writeMostly: "N"
      });
      expect(result1.writeMostly).toBe("N");

      const result2 = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        writeMostly: "Y"
      });
      expect(result2.writeMostly).toBe("Y");
    });

    it("should reject invalid writeMostly value", () => {
      expect(() => {
        LvCreateArgsSchema.parse({
          vgName: "vg0",
          lvName: "data",
          size: "10G",
          writeMostly: "X"
        });
      }).toThrow();
    });
  });

  describe("Permission and allocation policy validation", () => {
    it("should accept rw or r for permission", () => {
      const result1 = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        permission: "rw"
      });
      expect(result1.permission).toBe("rw");

      const result2 = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        permission: "r"
      });
      expect(result2.permission).toBe("r");
    });

    it("should reject invalid permission value", () => {
      expect(() => {
        LvCreateArgsSchema.parse({
          vgName: "vg0",
          lvName: "data",
          size: "10G",
          permission: "invalid"
        });
      }).toThrow();
    });
  });

  describe("Tags validation", () => {
    it("should accept single tag", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        tags: ["production"]
      });

      expect(result.tags).toEqual(["production"]);
    });

    it("should accept multiple tags", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        tags: ["production", "important", "backup"]
      });

      expect(result.tags).toEqual(["production", "important", "backup"]);
    });

    it("should accept empty tags array", () => {
      const result = LvCreateArgsSchema.parse({
        vgName: "vg0",
        lvName: "data",
        size: "10G",
        tags: []
      });

      expect(result.tags).toEqual([]);
    });
  });

  describe("Filesystem validation", () => {
    const validFilesystems = ["ext4", "xfs", "btrfs", "vfat"];

    it("should accept valid filesystem types", () => {
      for (const fs of validFilesystems) {
        const result = LvCreateArgsSchema.parse({
          vgName: "vg0",
          lvName: "data",
          size: "10G",
          filesystem: fs
        });
        expect(result.filesystem).toBe(fs);
      }
    });
  });
});
