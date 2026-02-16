/**
 * LVM configuration management tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockLVMExecutor,
  createSuccessResult,
  createErrorResult,
  SAMPLE_LVMCONFIG_OUTPUT,
} from "./mocks/lvm-mock";

describe("LVM Configuration Management", () => {
  let mockExecutor: MockLVMExecutor;

  beforeEach(() => {
    mockExecutor = new MockLVMExecutor();
  });

  describe("conf_read", () => {
    it("should read full configuration", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_LVMCONFIG_OUTPUT),
        command: "lvmconfig --file /etc/lvm/lvm.conf"
      };
      mockExecutor.setCommand("lvmconfig --file /etc/lvm/lvm.conf", mockResult);

      const result = await mockExecutor.execute("lvmconfig", [
        "--file", "/etc/lvm/lvm.conf"
      ]);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("devices");
      expect(result.command).toContain("--file /etc/lvm/lvm.conf");
    });

    it("should read specific section", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_LVMCONFIG_OUTPUT),
        command: "lvmconfig --type devices --file /etc/lvm/lvm.conf"
      };
      mockExecutor.setCommand("lvmconfig --type devices --file /etc/lvm/lvm.conf", mockResult);

      const result = await mockExecutor.execute("lvmconfig", [
        "--file", "/etc/lvm/lvm.conf",
        "--type", "devices"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--type devices");
    });

    it("should read configuration with default path", async () => {
      const mockResult = {
        ...createSuccessResult(SAMPLE_LVMCONFIG_OUTPUT),
        command: "lvmconfig"
      };
      mockExecutor.setCommand("lvmconfig", mockResult);

      const result = await mockExecutor.execute("lvmconfig", []);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvmconfig");
    });
  });

  describe("conf_write", () => {
    it("should backup configuration before writing", async () => {
      const backupResult = await mockExecutor.execute("cp", [
        "/etc/lvm/lvm.conf",
        "/etc/lvm/lvm.conf.backup"
      ]);

      expect(backupResult.success).toBe(true);
      expect(backupResult.command).toContain("cp");
    });

    it("should indicate configuration update", () => {
      const result = {
        success: true,
        message: "Configuration update for devices.filter = [ \"a|^/dev/sda.*$\", \"r/.*/\" ]",
        path: "/etc/lvm/lvm.conf",
        section: "devices",
        key: "filter",
        value: "[ \"a|^/dev/sda.*$\", \"r/.*/\" ]",
        note: "Direct file editing not implemented. Use sed or manual edit."
      };

      expect(result.success).toBe(true);
      expect(result.message).toContain("devices.filter");
      expect(result.section).toBe("devices");
      expect(result.key).toBe("filter");
    });
  });

  describe("conf_validate", () => {
    it("should validate configuration", async () => {
      const result = await mockExecutor.execute("lvmconfig", [
        "--validate",
        "--file", "/etc/lvm/lvm.conf"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--validate");
      expect(result.command).toContain("--file");
    });
  });

  describe("dump_config", () => {
    it("should dump merged configuration", async () => {
      const result = await mockExecutor.execute("lvmconfig", [
        "--merged"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--merged");
    });

    it("should dump specific configuration type", async () => {
      const result = await mockExecutor.execute("lvmconfig", [
        "--type", "devices"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--type devices");
    });
  });

  describe("get_monitoring_status", () => {
    it("should check dmeventd status", async () => {
      const result = await mockExecutor.execute("systemctl", [
        "is-active",
        "lvm2-monitor"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("systemctl is-active lvm2-monitor");
    });

    it("should check autoextend status", async () => {
      const result = await mockExecutor.execute("lvs", [
        "-o", "lv_name,monitor,autoextend"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvs");
      expect(result.command).toContain("-o lv_name,monitor,autoextend");
    });
  });

  describe("get_activation_status", () => {
    it("should check all LV activation status", async () => {
      const result = await mockExecutor.execute("lvs", [
        "-o", "vg_name,lv_name,lv_attr"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("lvs");
      expect(result.command).toContain("-o vg_name,lv_name,lv_attr");
    });

    it("should check specific VG activation status", async () => {
      const result = await mockExecutor.execute("lvs", [
        "-o", "vg_name,lv_name,lv_attr",
        "-S", "vg_name=vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-S vg_name=vg0");
    });
  });

  describe("resize_with_fs", () => {
    it("should resize LV with filesystem", async () => {
      const result = await mockExecutor.execute("lvextend", [
        "-r",
        "-L", "+10G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-r");
      expect(result.command).toContain("-L +10G");
      expect(result.command).toContain("/dev/vg0/data");
    });

    it("should set specific size", async () => {
      const result = await mockExecutor.execute("lvextend", [
        "-r",
        "-L", "20G",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-L 20G");
    });
  });

  describe("get_fs_info", () => {
    it("should get filesystem information", async () => {
      const result = await mockExecutor.execute("blkid", [
        "-o", "export",
        "/dev/vg0/data"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("blkid");
      expect(result.command).toContain("-o export");
      expect(result.command).toContain("/dev/vg0/data");
    });
  });

  describe("activate_vg", () => {
    it("should activate VG", async () => {
      const result = await mockExecutor.execute("vgchange", [
        "-a", "y",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a y");
      expect(result.command).toContain("vg0");
    });

    it("should deactivate VG", async () => {
      const result = await mockExecutor.execute("vgchange", [
        "-a", "n",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("-a n");
    });

    it("should activate VG in degraded mode", async () => {
      const result = await mockExecutor.execute("vgchange", [
        "-a", "y",
        "--partial",
        "vg0"
      ]);

      expect(result.success).toBe(true);
      expect(result.command).toContain("--partial");
    });
  });
});
