/**
 * Volume Group management tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockLVMExecutor,
  createSuccessResult,
  createErrorResult,
  SAMPLE_VGDISPLAY_OUTPUT,
} from "./mocks/lvm-mock";

describe("VG Management", () => {
  let mockExecutor: MockLVMExecutor;

  beforeEach(() => {
    mockExecutor = new MockLVMExecutor();
  });

  describe("vgcreate", () => {
    it("should create basic VG command", async () => {
      const result = await mockExecutor.execute("vgcreate", [
        "vg0",
        "/dev/sdb1",
        "/dev/sdc1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("vgcreate");
      expect(result.command).toContain("vg0");
      expect(result.command).toContain("/dev/sdb1");
      expect(result.command).toContain("/dev/sdc1");
    });

    it("should create VG with max PV option", async () => {
      const result = await mockExecutor.execute("vgcreate", [
        "-p", "10",
        "vg0",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-p 10");
    });

    it("should create VG with max LV option", async () => {
      const result = await mockExecutor.execute("vgcreate", [
        "-l", "100",
        "vg0",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-l 100");
    });

    it("should create VG with extent size option", async () => {
      const result = await mockExecutor.execute("vgcreate", [
        "-s", "4M",
        "vg0",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-s 4M");
    });

    it("should create VG with force option", async () => {
      const result = await mockExecutor.execute("vgcreate", [
        "-f",
        "vg0",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-f");
    });
  });

  describe("vgextend", () => {
    it("should extend VG by adding PVs", async () => {
      const result = await mockExecutor.execute("vgextend", [
        "vg0",
        "/dev/sdd1",
        "/dev/sde1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("vgextend");
      expect(result.command).toContain("vg0");
      expect(result.command).toContain("/dev/sdd1");
      expect(result.command).toContain("/dev/sde1");
    });
  });

  describe("vgremove", () => {
    it("should remove VG", async () => {
      const result = await mockExecutor.execute("vgremove", [
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("vgremove");
      expect(result.command).toContain("vg0");
    });

    it("should remove VG with force option", async () => {
      const result = await mockExecutor.execute("vgremove", [
        "-f",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-f");
    });
  });

  describe("vgdisplay", () => {
    it("should display specific VG information", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_VGDISPLAY_OUTPUT),
        command: "vgdisplay -c vg0"
      };
      mockExecutor.setCommand("vgdisplay -c vg0", mockResult);

      const result = await mockExecutor.execute("vgdisplay", ["-c", "vg0"]);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("vg0");
      expect(result.command).toContain("-c vg0");
    });

    it("should display all VG information", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_VGDISPLAY_OUTPUT),
        command: "vgdisplay -c"
      };
      mockExecutor.setCommand("vgdisplay -c", mockResult);

      const result = await mockExecutor.execute("vgdisplay", ["-c"]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("vgdisplay -c");
    });
  });

  describe("vgs", () => {
    it("should list all VGs", async () => {
      const result = await mockExecutor.execute("vgs", []);

      expect(result.success).toBe(true);
      expect(result.command).toContain("vgs");
    });

    it("should support additional options", async () => {
      const result = await mockExecutor.execute("vgs", [
        "-a",
        "-o+pv_count"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a");
      expect(result.command).toContain("-o+pv_count");
    });
  });
});
