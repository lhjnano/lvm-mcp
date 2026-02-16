import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MockLVMExecutor } from "./mocks/lvm-mock";
import { setExecutor } from "../index.js";
import * as index from "../index.js";

describe("LVM Handler Unit Tests", () => {
  let mockExecutor: MockLVMExecutor;

  beforeEach(() => {
    mockExecutor = new MockLVMExecutor();
    setExecutor(mockExecutor);
  });

  afterEach(() => {
    mockExecutor.clear();
  });

  describe("LV Handlers", () => {
    it("should create LV with basic parameters", async () => {
      mockExecutor.setCommand("lvcreate -L 10G -n test_lv vg0", {
        success: true,
        stdout: "Logical volume \"test_lv\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 10G -n test_lv vg0",
      });

      const result = await index.lvcreate({
        vgName: "vg0",
        lvName: "test_lv",
        size: "10G",
        lvType: "linear",
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("test_lv");
    });

    it("should create striped LV", async () => {
      mockExecutor.setCommand("lvcreate -L 50G -n stripe_lv -i 4 -I 64K vg0", {
        success: true,
        stdout: "Logical volume \"stripe_lv\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 50G -n stripe_lv -i 4 -I 64K vg0",
      });

      const result = await index.lvcreate({
        vgName: "vg0",
        lvName: "stripe_lv",
        size: "50G",
        lvType: "striped",
        stripes: 4,
        stripeSize: "64K",
      });

      expect(result.success).toBe(true);
    });

    it("should create mirrored LV", async () => {
      mockExecutor.setCommand("lvcreate -L 20G -n mirror_lv -m 1 vg0", {
        success: true,
        stdout: "Logical volume \"mirror_lv\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 20G -n mirror_lv -m 1 vg0",
      });

      const result = await index.lvcreate({
        vgName: "vg0",
        lvName: "mirror_lv",
        size: "20G",
        lvType: "mirror",
        mirrors: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should create RAID LV", async () => {
      mockExecutor.setCommand("lvcreate -L 100G -n raid_lv --type raid5 vg0", {
        success: true,
        stdout: "Logical volume \"raid_lv\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 100G -n raid_lv --type raid5 vg0",
      });

      const result = await index.lvcreate({
        vgName: "vg0",
        lvName: "raid_lv",
        size: "100G",
        lvType: "raid5",
        raidLevel: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should extend LV with size", async () => {
      mockExecutor.setCommand("lvextend -L 20G /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume vg0/test_lv successfully resized",
        stderr: "",
        returnCode: 0,
        command: "lvextend -L 20G /dev/vg0/test_lv",
      });

      const result = await index.lvextend({
        lvPath: "/dev/vg0/test_lv",
        size: "20G",
        resizeFs: false,
      });

      expect(result.success).toBe(true);
    });

    it("should extend LV with size addition", async () => {
      mockExecutor.setCommand("lvextend -L +10G /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume vg0/test_lv successfully resized",
        stderr: "",
        returnCode: 0,
        command: "lvextend -L +10G /dev/vg0/test_lv",
      });

      const result = await index.lvextend({
        lvPath: "/dev/vg0/test_lv",
        sizeAdd: "+10G",
        resizeFs: false,
      });

      expect(result.success).toBe(true);
    });

    it("should extend LV with resize filesystem", async () => {
      mockExecutor.setCommand("lvextend -r -L 20G /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume vg0/test_lv successfully resized",
        stderr: "",
        returnCode: 0,
        command: "lvextend -r -L 20G /dev/vg0/test_lv",
      });

      const result = await index.lvextend({
        lvPath: "/dev/vg0/test_lv",
        size: "20G",
        resizeFs: true,
      });

      expect(result.success).toBe(true);
    });

    it("should reduce LV", async () => {
      mockExecutor.setCommand("lvreduce -L 5G /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume vg0/test_lv successfully resized",
        stderr: "",
        returnCode: 0,
        command: "lvreduce -L 5G /dev/vg0/test_lv",
      });

      const result = await index.lvreduce({
        lvPath: "/dev/vg0/test_lv",
        size: "5G",
        resizeFs: false,
      });

      expect(result.success).toBe(true);
    });

    it("should remove LV", async () => {
      mockExecutor.setCommand("lvremove /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume \"test_lv\" successfully removed",
        stderr: "",
        returnCode: 0,
        command: "lvremove /dev/vg0/test_lv",
      });

      const result = await index.lvremove({
        lvPath: "/dev/vg0/test_lv",
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should remove LV with force", async () => {
      mockExecutor.setCommand("lvremove -f /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume \"test_lv\" successfully removed",
        stderr: "",
        returnCode: 0,
        command: "lvremove -f /dev/vg0/test_lv",
      });

      const result = await index.lvremove({
        lvPath: "/dev/vg0/test_lv",
        force: true,
      });

      expect(result.success).toBe(true);
    });

    it("should change LV activation", async () => {
      mockExecutor.setCommand("lvchange -a y /dev/vg0/test_lv", {
        success: true,
        stdout: "Logical volume vg0/test_lv changed",
        stderr: "",
        returnCode: 0,
        command: "lvchange -a y /dev/vg0/test_lv",
      });

      const result = await index.lvchange({
        lvPath: "/dev/vg0/test_lv",
        activate: true,
      });

      expect(result.success).toBe(true);
    });

    it("should display LV information", async () => {
      mockExecutor.setCommand("lvdisplay /dev/vg0/test_lv", {
        success: true,
        stdout: "  --- Logical volume ---",
        stderr: "",
        returnCode: 0,
        command: "lvdisplay /dev/vg0/test_lv",
      });

      const result = await index.lvdisplay("/dev/vg0/test_lv");

      expect(result.success).toBe(true);
    });

    it("should list LVs", async () => {
      mockExecutor.setCommand("lvs", {
        success: true,
        stdout: "LV VG Attr LSize",
        stderr: "",
        returnCode: 0,
        command: "lvs",
      });

      const result = await index.lvs();

      expect(result.success).toBe(true);
    });
  });

  describe("VG Handlers", () => {
    it("should create VG", async () => {
      mockExecutor.setCommand("vgcreate vg0 /dev/sdb1 /dev/sdc1", {
        success: true,
        stdout: "Volume group \"vg0\" successfully created",
        stderr: "",
        returnCode: 0,
        command: "vgcreate vg0 /dev/sdb1 /dev/sdc1",
      });

      const result = await index.vgcreate({
        vgName: "vg0",
        physicalVolumes: ["/dev/sdb1", "/dev/sdc1"],
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should create VG with extent size", async () => {
      mockExecutor.setCommand("vgcreate -s 8M vg0 /dev/sdb1", {
        success: true,
        stdout: "Volume group \"vg0\" successfully created",
        stderr: "",
        returnCode: 0,
        command: "vgcreate -s 8M vg0 /dev/sdb1",
      });

      const result = await index.vgcreate({
        vgName: "vg0",
        physicalVolumes: ["/dev/sdb1"],
        force: false,
        extentSize: "8M",
      });

      expect(result.success).toBe(true);
    });

    it("should extend VG", async () => {
      mockExecutor.setCommand("vgextend vg0 /dev/sdc1", {
        success: true,
        stdout: "Volume group \"vg0\" successfully extended",
        stderr: "",
        returnCode: 0,
        command: "vgextend vg0 /dev/sdc1",
      });

      const result = await index.vgextend({
        vgName: "vg0",
        physicalVolumes: ["/dev/sdc1"],
      });

      expect(result.success).toBe(true);
    });

    it("should remove VG", async () => {
      mockExecutor.setCommand("vgremove vg0", {
        success: true,
        stdout: "Volume group \"vg0\" successfully removed",
        stderr: "",
        returnCode: 0,
        command: "vgremove vg0",
      });

      const result = await index.vgremove({
        vgName: "vg0",
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should display VG information", async () => {
      mockExecutor.setCommand("vgdisplay vg0", {
        success: true,
        stdout: "  --- Volume group ---",
        stderr: "",
        returnCode: 0,
        command: "vgdisplay vg0",
      });

      const result = await index.vgdisplay("vg0");

      expect(result.success).toBe(true);
    });

    it("should list VGs", async () => {
      mockExecutor.setCommand("vgs", {
        success: true,
        stdout: "VG #PV #LV #SN Attr VSize VFree",
        stderr: "",
        returnCode: 0,
        command: "vgs",
      });

      const result = await index.vgs();

      expect(result.success).toBe(true);
    });
  });

  describe("PV Handlers", () => {
    it("should create PV", async () => {
      mockExecutor.setCommand("pvcreate /dev/sdb1", {
        success: true,
        stdout: "Physical volume \"/dev/sdb1\" successfully created",
        stderr: "",
        returnCode: 0,
        command: "pvcreate /dev/sdb1",
      });

      const result = await index.pvcreate({
        device: "/dev/sdb1",
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should create PV with data alignment", async () => {
      mockExecutor.setCommand("pvcreate --dataalignment 64K /dev/sdb1", {
        success: true,
        stdout: "Physical volume \"/dev/sdb1\" successfully created",
        stderr: "",
        returnCode: 0,
        command: "pvcreate --dataalignment 64K /dev/sdb1",
      });

      const result = await index.pvcreate({
        device: "/dev/sdb1",
        dataAlignment: 64,
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should remove PV", async () => {
      mockExecutor.setCommand("pvremove /dev/sdb1", {
        success: true,
        stdout: "Labels on physical volume \"/dev/sdb1\" successfully wiped",
        stderr: "",
        returnCode: 0,
        command: "pvremove /dev/sdb1",
      });

      const result = await index.pvremove({
        pvName: "/dev/sdb1",
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should display PV information", async () => {
      mockExecutor.setCommand("pvdisplay /dev/sdb1", {
        success: true,
        stdout: "  --- Physical volume ---",
        stderr: "",
        returnCode: 0,
        command: "pvdisplay /dev/sdb1",
      });

      const result = await index.pvdisplay("/dev/sdb1");

      expect(result.success).toBe(true);
    });

    it("should list PVs", async () => {
      mockExecutor.setCommand("pvs", {
        success: true,
        stdout: "PV VG Fmt Attr PSize PFree",
        stderr: "",
        returnCode: 0,
        command: "pvs",
      });

      const result = await index.pvs();

      expect(result.success).toBe(true);
    });
  });

  describe("Cache Handlers", () => {
    it("should create cache", async () => {
      mockExecutor.setCommand("lvconvert --type cache --cachepool fast_pool /dev/vg0/slow_lv", {
        success: true,
        stdout: "Logical volume vg0/slow_lv is now cached",
        stderr: "",
        returnCode: 0,
        command: "lvconvert --type cache --cachepool fast_pool /dev/vg0/slow_lv",
      });

      const result = await index.cache_create({
        origin: "/dev/vg0/slow_lv",
        fastPvs: ["/dev/nvme0n1"],
      });

      expect(result.success).toBe(true);
    });

    it("should split cache", async () => {
      mockExecutor.setCommand("lvconvert --splitcache /dev/vg0/cached_lv", {
        success: true,
        stdout: "Logical volume vg0/cached_lv cache split successfully",
        stderr: "",
        returnCode: 0,
        command: "lvconvert --splitcache /dev/vg0/cached_lv",
      });

      const result = await index.splitcache({
        lvPath: "/dev/vg0/cached_lv",
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it("should split cache with force", async () => {
      mockExecutor.setCommand("lvconvert --splitcache --yes /dev/vg0/cached_lv", {
        success: true,
        stdout: "Logical volume vg0/cached_lv cache split successfully",
        stderr: "",
        returnCode: 0,
        command: "lvconvert --splitcache --yes /dev/vg0/cached_lv",
      });

      const result = await index.splitcache({
        lvPath: "/dev/vg0/cached_lv",
        force: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("RAID Handlers", () => {
    it("should scrub RAID for check", async () => {
      mockExecutor.setCommand("lvchange --syncaction check /dev/vg0/raid_lv", {
        success: true,
        stdout: "Logical volume vg0/raid_lv sync action check started",
        stderr: "",
        returnCode: 0,
        command: "lvchange --syncaction check /dev/vg0/raid_lv",
      });

      const result = await index.raidscrub({
        lvPath: "/dev/vg0/raid_lv",
        syncaction: "check",
      });

      expect(result.success).toBe(true);
    });

    it("should scrub RAID for repair", async () => {
      mockExecutor.setCommand("lvchange --syncaction repair /dev/vg0/raid_lv", {
        success: true,
        stdout: "Logical volume vg0/raid_lv sync action repair started",
        stderr: "",
        returnCode: 0,
        command: "lvchange --syncaction repair /dev/vg0/raid_lv",
      });

      const result = await index.raidscrub({
        lvPath: "/dev/vg0/raid_lv",
        syncaction: "repair",
      });

      expect(result.success).toBe(true);
    });

    it("should set RAID recovery rate", async () => {
      mockExecutor.setCommand("lvchange --minrecoveryrate 128KiB/s --maxrecoveryrate 2MiB/s /dev/vg0/raid_lv", {
        success: true,
        stdout: "Logical volume vg0/raid_lv recovery rate changed",
        stderr: "",
        returnCode: 0,
        command: "lvchange --minrecoveryrate 128KiB/s --maxrecoveryrate 2MiB/s /dev/vg0/raid_lv",
      });

      const result = await index.setraidrecoveryrate({
        lvPath: "/dev/vg0/raid_lv",
        minRecoveryRate: "128KiB/s",
        maxRecoveryRate: "2MiB/s",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Snapshot Handlers", () => {
    it("should create snapshot", async () => {
      mockExecutor.setCommand("lvcreate -L 5G -n snap -s /dev/vg0/lv", {
        success: true,
        stdout: "Logical volume \"snap\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 5G -n snap -s /dev/vg0/lv",
      });

      const result = await index.snapshot_create({
        snapshotName: "snap",
        sourceLvPath: "/dev/vg0/lv",
        size: "5G",
        thin: false,
      });

      expect(result.success).toBe(true);
    });

    it("should list snapshots", async () => {
      mockExecutor.setCommand("lvs -o lv_name,vg_name,origin,lv_size", {
        success: true,
        stdout: "LV VG Origin LSize",
        stderr: "",
        returnCode: 0,
        command: "lvs -o lv_name,vg_name,origin,lv_size",
      });

      const result = await index.listsnapshots({});

      expect(result.success).toBe(true);
    });

    it("should list snapshots for specific VG", async () => {
      mockExecutor.setCommand("lvs -o lv_name,vg_name,origin,lv_size vg0", {
        success: true,
        stdout: "LV VG Origin LSize",
        stderr: "",
        returnCode: 0,
        command: "lvs -o lv_name,vg_name,origin,lv_size vg0",
      });

      const result = await index.listsnapshots({
        vgName: "vg0",
      });

      expect(result.success).toBe(true);
    });

    it("should remove snapshot", async () => {
      mockExecutor.setCommand("lvremove /dev/vg0/snap", {
        success: true,
        stdout: "Logical volume \"snap\" successfully removed",
        stderr: "",
        returnCode: 0,
        command: "lvremove /dev/vg0/snap",
      });

      const result = await index.removesnapshot({
        snapshotPath: "/dev/vg0/snap",
        force: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Thin Pool Handlers", () => {
    it("should create thin pool", async () => {
      mockExecutor.setCommand("lvcreate -L 100G -T vg0/thinpool", {
        success: true,
        stdout: "Logical volume \"thinpool\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 100G -T vg0/thinpool",
      });

      const result = await index.thinpool_create({
        poolName: "thinpool",
        vgName: "vg0",
        size: "100G",
        zero: false,
      });

      expect(result.success).toBe(true);
    });

    it("should create thin pool with chunk size", async () => {
      mockExecutor.setCommand("lvcreate -L 100G -T vg0/thinpool -c 64K", {
        success: true,
        stdout: "Logical volume \"thinpool\" created",
        stderr: "",
        returnCode: 0,
        command: "lvcreate -L 100G -T vg0/thinpool -c 64K",
      });

      const result = await index.thinpool_create({
        poolName: "thinpool",
        vgName: "vg0",
        size: "100G",
        zero: false,
        chunkSize: "64K",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Configuration Handlers", () => {
    it("should read configuration", async () => {
      mockExecutor.setCommand("lvmconfig", {
        success: true,
        stdout: "devices { dir=\"/dev\" }",
        stderr: "",
        returnCode: 0,
        command: "lvmconfig",
      });

      const result = await index.conf_read({});

      expect(result.success).toBe(true);
    });

    it("should write configuration", async () => {
      mockExecutor.setCommand("lvmetad --config 'devices { filter=[\"a|^/dev/sda.*|\", \"r|.*|\"] }'", {
        success: true,
        stdout: "Configuration updated",
        stderr: "",
        returnCode: 0,
        command: "lvmetad --config 'devices { filter=[\"a|^/dev/sda.*|\", \"r|.*|\"] }'",
      });

      const result = await index.conf_write({
        section: "devices",
        key: "filter",
        value: "[\"a|^/dev/sda.*|\", \"r|.*|\"]",
        backup: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle command failure", async () => {
      mockExecutor.setCommand("lvcreate -L 10G -n test_lv vg0", {
        success: false,
        stdout: "",
        stderr: "Volume group \"vg0\" not found",
        returnCode: 5,
        command: "lvcreate -L 10G -n test_lv vg0",
      });

      const result = await index.lvcreate({
        vgName: "vg0",
        lvName: "test_lv",
        size: "10G",
        lvType: "linear",
      });

      expect(result.success).toBe(false);
      expect(result.stderr).toContain("not found");
    });
  });
});
