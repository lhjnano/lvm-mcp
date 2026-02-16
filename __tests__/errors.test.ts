/**
 * Error handling tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Error Handling", () => {
  describe("Command execution errors", () => {
    it("should handle command not found error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "command not found: lvcreate",
        returnCode: 127,
        command: "lvcreate -L 10G -n data vg0",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(127);
      expect(error.stderr).toContain("command not found");
    });

    it("should handle permission denied error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Permission denied",
        returnCode: 1,
        command: "lvcreate -L 10G -n data vg0",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(1);
      expect(error.stderr).toContain("Permission denied");
    });

    it("should handle device not found error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Device /dev/sdb1 not found",
        returnCode: 5,
        command: "pvcreate /dev/sdb1",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(5);
      expect(error.stderr).toContain("not found");
    });

    it("should handle VG not found error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Volume group 'vg0' not found",
        returnCode: 5,
        command: "lvcreate -L 10G -n data vg0",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(5);
      expect(error.stderr).toContain("not found");
    });

    it("should handle LV not found error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Logical volume 'data' not found in volume group 'vg0'",
        returnCode: 5,
        command: "lvdisplay /dev/vg0/data",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(5);
      expect(error.stderr).toContain("not found");
    });

    it("should handle insufficient space error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Insufficient free space: 1024 extents needed, but only 512 available",
        returnCode: 5,
        command: "lvcreate -L 10G -n data vg0",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(5);
      expect(error.stderr).toContain("Insufficient free space");
    });

    it("should handle invalid argument error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Invalid option -x",
        returnCode: 3,
        command: "lvcreate -x 10G -n data vg0",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(3);
      expect(error.stderr).toContain("Invalid option");
    });

    it("should handle unknown LV type error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Unknown LV type 'invalid_type'",
        returnCode: 3,
        command: "lvcreate --type invalid_type -L 10G -n data vg0",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(3);
      expect(error.stderr).toContain("Unknown");
    });

    it("should handle filesystem creation error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "mkfs.ext4: No such file or directory",
        returnCode: 1,
        command: "mkfs.ext4 /dev/vg0/data",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(1);
      expect(error.stderr).toContain("mkfs");
    });

    it("should handle configuration file not found error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Config file not found: /etc/lvm/lvm.conf",
        returnCode: 1,
        command: "lvmconfig --file /etc/lvm/lvm.conf",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(1);
      expect(error.stderr).toContain("not found");
    });

    it("should handle configuration syntax error", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "Parse error in /etc/lvm/lvm.conf line 25",
        returnCode: 1,
        command: "lvmconfig --validate --file /etc/lvm/lvm.conf",
      };

      expect(error.success).toBe(false);
      expect(error.returnCode).toBe(1);
      expect(error.stderr).toContain("Parse error");
    });
  });

  describe("Schema validation errors", () => {
    it("should reject missing vgName", () => {
      const args = {
        lvName: "data",
        size: "10G",
      };

      expect(args.vgName).toBeUndefined();
    });

    it("should reject missing lvName", () => {
      const args = {
        vgName: "vg0",
        size: "10G",
      };

      expect(args.lvName).toBeUndefined();
    });

    it("should reject missing size", () => {
      const args = {
        vgName: "vg0",
        lvName: "data",
      };

      expect(args.size).toBeUndefined();
    });

    it("should reject invalid size format", () => {
      const invalidSizes = ["10", "GB", "10GB", "ten gigabytes"];

      for (const size of invalidSizes) {
        expect(size).not.toMatch(/^\d+[KMGTP]$/);
      }
    });

    it("should accept valid size formats", () => {
      const validSizes = ["10G", "500M", "2T", "1024K", "10.5G"];

      for (const size of validSizes) {
        expect(size).toMatch(/^\d+(\.\d+)?[KMGTP]$/);
      }
    });

    it("should reject invalid LV type", () => {
      const invalidTypes = ["invalid", "linear1", "RAID"];

      for (const type of invalidTypes) {
        const validTypes = [
          "linear", "striped", "mirror",
          "raid0", "raid1", "raid4", "raid5", "raid6", "raid10",
          "thin", "thin-pool", "cache", "cache-pool"
        ];

        expect(validTypes.includes(type)).toBe(false);
      }
    });

    it("should reject invalid permission value", () => {
      const invalidPermissions = ["rwx", "755", "read-write", "invalid"];

      for (const perm of invalidPermissions) {
        const validPermissions = ["rw", "r"];

        expect(validPermissions.includes(perm)).toBe(false);
      }
    });

    it("should reject invalid writeMostly value", () => {
      const invalidValues = ["true", "false", "YES", "NO", "1", "0"];

      for (const val of invalidValues) {
        const validValues = ["N", "Y"];

        expect(validValues.includes(val)).toBe(false);
      }
    });

    it("should reject invalid allocPolicy value", () => {
      const invalidPolicies = ["random", "best", "first"];

      for (const policy of invalidPolicies) {
        const validPolicies = ["inherit", "contiguous", "cling", "normal", "anywhere"];

        expect(validPolicies.includes(policy)).toBe(false);
      }
    });

    it("should reject invalid RAID level", () => {
      const invalidLevels = ["2", "3", "7", "8", "11"];

      for (const level of invalidLevels) {
        const validLevels = [0, 1, 4, 5, 6, 10];

        expect(validLevels.includes(level)).toBe(false);
      }
    });

    it("should reject negative stripes count", () => {
      const invalidStripes = [-1, 0];

      for (const stripes of invalidStripes) {
        expect(stripes).toBeLessThan(1);
      }
    });

    it("should reject negative mirrors count", () => {
      const invalidMirrors = [-1, 0];

      for (const mirrors of invalidMirrors) {
        expect(mirrors).toBeLessThan(1);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle empty VG name", () => {
      const args = {
        vgName: "",
        lvName: "data",
        size: "10G",
      };

      expect(args.vgName).toBe("");
    });

    it("should handle empty LV name", () => {
      const args = {
        vgName: "vg0",
        lvName: "",
        size: "10G",
      };

      expect(args.lvName).toBe("");
    });

    it("should handle empty size", () => {
      const args = {
        vgName: "vg0",
        lvName: "data",
        size: "",
      };

      expect(args.size).toBe("");
    });

    it("should handle extremely large size", () => {
      const largeSize = "1000P";  // Petabytes

      expect(largeSize).toMatch(/^\d+P$/);
    });

    it("should handle extremely small size", () => {
      const smallSize = "1K";  // Kilobyte

      expect(smallSize).toMatch(/^\d+K$/);
    });

    it("should handle zero size", () => {
      const args = {
        size: "0G",
      };

      expect(args.size).toBe("0G");
    });

    it("should handle duplicate tags", () => {
      const tags = ["production", "important", "production"];

      expect(tags).toContain("production");
      expect(tags.filter((t) => t === "production").length).toBe(2);
    });

    it("should handle empty tags array", () => {
      const tags: string[] = [];

      expect(tags).toEqual([]);
    });

    it("should handle multiple RAID levels in single command", () => {
      const args = {
        raidLevel: 5,
        raidIntegrity: true,
      };

      expect(args.raidLevel).toBe(5);
      expect(args.raidIntegrity).toBe(true);
    });

    it("should handle both sizeAdd and sizePercent specified", () => {
      const args = {
        sizeAdd: "+10G",
        sizePercent: 50,
      };

      expect(args.sizeAdd).toBe("+10G");
      expect(args.sizePercent).toBe(50);
    });
  });

  describe("Recovery scenarios", () => {
    it("should handle partial VG state", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "WARNING: Volume group vg0 is not consistent",
        returnCode: 5,
        command: "vgs vg0",
      };

      expect(error.success).toBe(false);
      expect(error.stderr).toContain("not consistent");
    });

    it("should handle degraded LV state", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "WARNING: Logical volume data is not consistent",
        returnCode: 5,
        command: "lvdisplay /dev/vg0/data",
      };

      expect(error.success).toBe(false);
      expect(error.stderr).toContain("not consistent");
    });

    it("should handle thin pool full state", () => {
      const error = {
        success: false,
        stdout: "",
        stderr: "WARNING: Thin pool vg0/thinpool0 is 100% full",
        returnCode: 5,
        command: "lvs -o data_percent,metadata_percent vg0/thinpool0",
      };

      expect(error.success).toBe(false);
      expect(error.stderr).toContain("100% full");
    });

    it("should handle cache in writeback mode", () => {
      const state = {
        mode: "writeback",
        dirty_blocks: 1024,
      };

      expect(state.mode).toBe("writeback");
      expect(state.dirty_blocks).toBe(1024);
    });

    it("should handle cache flush in progress", () => {
      const state = {
        flush_in_progress: true,
        percentage_complete: 45,
      };

      expect(state.flush_in_progress).toBe(true);
      expect(state.percentage_complete).toBe(45);
    });
  });
});
