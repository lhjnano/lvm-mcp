/**
 * Logical Volume management tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockLVMExecutor,
  createSuccessResult,
  createErrorResult,
  SAMPLE_LVDISPLAY_OUTPUT,
  SAMPLE_LVS_OUTPUT,
} from "./mocks/lvm-mock";

describe("LV Management", () => {
  let mockExecutor: MockLVMExecutor;

  beforeEach(() => {
    mockExecutor = new MockLVMExecutor();
  });

  describe("lvcreate", () => {
    it("should create basic linear LV command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "10G",
        "-n", "data",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvcreate");
      expect(result.command).toContain("-L 10G");
      expect(result.command).toContain("-n data");
      expect(result.command).toContain("vg0");
    });

    it("should create striped LV command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "50G",
        "-n", "stripe_test",
        "-i", "4",
        "-I", "64K",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-i 4");
      expect(result.command).toContain("-I 64K");
    });

    it("should create mirrored LV command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "20G",
        "-n", "mirror_test",
        "-m", "2",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-m 2");
    });

    it("should create RAID LV command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "100G",
        "-n", "raid5_data",
        "--type", "raid5",
        "-R", "2M",
        "--raidintegrity",
        "--minrecoveryrate", "128KiB/s",
        "--maxrecoveryrate", "2MiB/s",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--type raid5");
      expect(result.command).toContain("-R 2M");
      expect(result.command).toContain("--raidintegrity");
      expect(result.command).toContain("--minrecoveryrate 128KiB/s");
      expect(result.command).toContain("--maxrecoveryrate 2MiB/s");
    });

    it("should create thin LV command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "500G",
        "-n", "thin_vol",
        "-T", "vg0/thinpool0",
        "-c", "64K"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-T vg0/thinpool0");
      expect(result.command).toContain("-c 64K");
    });

    it("should create snapshot command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-s",
        "-n", "data_snap",
        "-L", "5G",
        "-c", "512K",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-s");
      expect(result.command).toContain("-n data_snap");
      expect(result.command).toContain("-L 5G");
      expect(result.command).toContain("-c 512K");
      expect(result.command).toContain("/dev/vg0/data");
    });

    it("should create thin-pool command", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "50G",
        "-n", "thinpool0",
        "-T",
        "-c", "64K",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-T");
      expect(result.command).toContain("-c 64K");
    });

    it("should create LV with filesystem option", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "10G",
        "-n", "data",
        "--filesystem", "ext4",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--filesystem ext4");
    });

    it("should create LV with tags", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "10G",
        "-n", "data",
        "--addtag", "production",
        "--addtag", "important",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--addtag production");
      expect(result.command).toContain("--addtag important");
    });

    it("should create contiguous LV", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "10G",
        "-n", "data",
        "-C",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-C");
    });

    it("should create LV with permission option", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "10G",
        "-n", "data",
        "-p", "r",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-p r");
    });

    it("should create LV with allocation policy", async () => {
      const result = await mockExecutor.execute("lvcreate", [
        "-L", "10G",
        "-n", "data",
        "--alloc", "normal",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--alloc normal");
    });
  });

  describe("lvextend", () => {
    it("should extend LV", async () => {
      const result = await mockExecutor.execute("lvextend", [
        "-r",
        "-L", "20G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-r");
      expect(result.command).toContain("-L 20G");
    });

    it("should extend LV with size addition", async () => {
      const result = await mockExecutor.execute("lvextend", [
        "-r",
        "-L", "+10G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-L +10G");
    });

    it("should extend LV with percentage", async () => {
      const result = await mockExecutor.execute("lvextend", [
        "-r",
        "-l", "50%VG",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-l 50%VG");
    });

    it("should include filesystem resize option", async () => {
      const result = await mockExecutor.execute("lvextend", [
        "-r",
        "-L", "+5G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-r");
    });
  });

  describe("lvreduce", () => {
    it("should reduce LV", async () => {
      const result = await mockExecutor.execute("lvreduce", [
        "-r",
        "-L", "5G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-L 5G");
    });

    it("should include filesystem resize option", async () => {
      const result = await mockExecutor.execute("lvreduce", [
        "-r",
        "-L", "5G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-r");
    });
  });

  describe("lvremove", () => {
    it("should remove LV", async () => {
      const result = await mockExecutor.execute("lvremove", [
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvremove");
      expect(result.command).toContain("/dev/vg0/data");
    });

    it("should remove LV with force option", async () => {
      const result = await mockExecutor.execute("lvremove", [
        "-f",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-f");
    });
  });

  describe("lvchange", () => {
    it("should activate LV", async () => {
      const result = await mockExecutor.execute("lvchange", [
        "-a", "y",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a y");
    });

    it("should deactivate LV", async () => {
      const result = await mockExecutor.execute("lvchange", [
        "-a", "n",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a n");
    });

    it("should set read-only permission", async () => {
      const result = await mockExecutor.execute("lvchange", [
        "-p", "r",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-p r");
    });

    it("should add tag", async () => {
      const result = await mockExecutor.execute("lvchange", [
        "--addtag", "production",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--addtag production");
    });

    it("should delete tag", async () => {
      const result = await mockExecutor.execute("lvchange", [
        "--deltag", "old",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--deltag old");
    });
  });

  describe("lvdisplay", () => {
    it("should display specific LV information", async () => {
      const result = await mockExecutor.execute("lvdisplay", ["-c", "/dev/vg0/data"]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvdisplay -c");
      expect(result.command).toContain("/dev/vg0/data");
    });

    it("should display all LV information", async () => {
      const result = await mockExecutor.execute("lvdisplay", ["-c"]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvdisplay -c");
    });
  });

  describe("lvs", () => {
    it("should list all LVs", async () => {
      const result = await mockExecutor.execute("lvs", []);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvs");
    });

    it("should support additional options", async () => {
      const result = await mockExecutor.execute("lvs", [
        "-a",
        "-o+seg_size"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a");
      expect(result.command).toContain("-o+seg_size");
    });
  });
});
