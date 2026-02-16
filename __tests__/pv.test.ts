/**
 * Physical Volume management tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockLVMExecutor,
  createSuccessResult,
  createErrorResult,
  SAMPLE_PVDISPLAY_OUTPUT,
} from "./mocks/lvm-mock";

describe("PV Management", () => {
  let mockExecutor: MockLVMExecutor;

  beforeEach(() => {
    mockExecutor = new MockLVMExecutor();
  });

  describe("pvcreate", () => {
    it("should create basic PV command", async () => {
      const result = await mockExecutor.execute("pvcreate", [
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("pvcreate");
      expect(result.command).toContain("/dev/sdb1");
    });

    it("should create PV with data alignment option", async () => {
      const result = await mockExecutor.execute("pvcreate", [
        "--dataalignment", "64K",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--dataalignment 64K");
    });

    it("should create PV with metadata size option", async () => {
      const result = await mockExecutor.execute("pvcreate", [
        "--metadatasize", "1024K",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--metadatasize 1024K");
    });

    it("should create PV with metadata copies option", async () => {
      const result = await mockExecutor.execute("pvcreate", [
        "--pvmetadatacopies", "2",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--pvmetadatacopies 2");
    });

    it("should create PV with force option", async () => {
      const result = await mockExecutor.execute("pvcreate", [
        "-f",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-f");
    });
  });

  describe("pvremove", () => {
    it("should remove PV", async () => {
      const result = await mockExecutor.execute("pvremove", [
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("pvremove");
      expect(result.command).toContain("/dev/sdb1");
    });

    it("should remove PV with force option", async () => {
      const result = await mockExecutor.execute("pvremove", [
        "-f",
        "/dev/sdb1"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-f");
    });
  });

  describe("pvdisplay", () => {
    it("should display specific PV information", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_PVDISPLAY_OUTPUT),
        command: "pvdisplay -c /dev/sdb1"
      };
      mockExecutor.setCommand("pvdisplay -c /dev/sdb1", mockResult);

      const result = await mockExecutor.execute("pvdisplay", ["-c", "/dev/sdb1"]);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("/dev/sdb1");
      expect(result.command).toContain("-c /dev/sdb1");
    });

    it("should display all PV information", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_PVDISPLAY_OUTPUT),
        command: "pvdisplay -c"
      };
      mockExecutor.setCommand("pvdisplay -c", mockResult);

      const result = await mockExecutor.execute("pvdisplay", ["-c"]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("pvdisplay -c");
    });
  });

  describe("pvs", () => {
    it("should list all PVs", async () => {
      const result = await mockExecutor.execute("pvs", []);

      expect(result.success).toBe(true);
      expect(result.command).toContain("pvs");
    });

    it("should support additional options", async () => {
      const result = await mockExecutor.execute("pvs", [
        "-a",
        "-o+vg_name"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a");
      expect(result.command).toContain("-o+vg_name");
    });
  });
});
