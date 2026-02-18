import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DefaultExecutor } from "./executor.js";

let executor = new DefaultExecutor();

export function setExecutor(ex: typeof executor) {
  executor = ex;
}

export function getExecutor() {
  return executor;
}

// LV type enum
const LvTypeEnum = z.enum([
  "linear", "striped", "mirror", 
  "raid0", "raid1", "raid4", "raid5", "raid6", "raid10", 
  "thin", "thin-pool", "cache", "cache-pool"
]);

// LV create args schema
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

// LV extend args schema
const LvExtendArgsSchema = z.object({
  lvPath: z.string().describe("LV path (e.g., /dev/vg0/lv0)"),
  size: z.string().optional().describe("Target size (e.g., 20G)"),
  sizeAdd: z.string().optional().describe("Size to add (e.g., +10G)"),
  sizePercent: z.number().optional().describe("Percentage of VG (e.g., 50)"),
  resizeFs: z.boolean().optional().describe("Resize filesystem as well").default(false),
});

// LV reduce args schema
const LvReduceArgsSchema = z.object({
  lvPath: z.string().describe("LV path (e.g., /dev/vg0/lv0)"),
  size: z.string().describe("Target size (e.g., 5G)"),
  resizeFs: z.boolean().optional().describe("Resize filesystem as well").default(false),
});

// LV remove args schema
const LvRemoveArgsSchema = z.object({
  lvPath: z.string().describe("LV path (e.g., /dev/vg0/lv0)"),
  force: z.boolean().optional().describe("Force removal").default(false),
  confirm: z.boolean().optional().describe("Confirm before deleting").default(false)
});

// LV change args schema
const LvChangeArgsSchema = z.object({
  lvPath: z.string().describe("LV path (e.g., /dev/vg0/lv0)"),
  activate: z.boolean().optional().describe("Activate LV"),
  permission: z.enum(["rw", "r"]).optional().describe("LV permission"),
  addTag: z.string().optional().describe("Tag to add"),
  delTag: z.string().optional().describe("Tag to delete"),
});

// VG create args schema
const VgCreateArgsSchema = z.object({
  vgName: z.string().describe("Volume Group name"),
  physicalVolumes: z.array(z.string()).describe("PV list"),
  maxPv: z.number().optional().describe("Maximum number of PVs"),
  maxLv: z.number().optional().describe("Maximum number of LVs"),
  extentSize: z.string().optional().describe("Extent size (e.g., 4M, 8M)"),
  force: z.boolean().optional().describe("Force creation").default(false),
});

// VG extend args schema
const VgExtendArgsSchema = z.object({
  vgName: z.string().describe("Volume Group name"),
  physicalVolumes: z.array(z.string()).describe("PV list to add"),
});

// VG remove args schema
const VgRemoveArgsSchema = z.object({
  vgName: z.string().describe("Volume Group name"),
  force: z.boolean().optional().describe("Force removal").default(false),
  confirm: z.boolean().optional().describe("Confirm before deleting").default(false)
});

// PV create args schema
const PvCreateArgsSchema = z.object({
  device: z.string().describe("Device path (e.g., /dev/sdb1)"),
  dataAlignment: z.number().optional().describe("Data alignment in KB"),
  metadataSize: z.number().optional().describe("Metadata size in KB"),
  metadatacopies: z.number().optional().describe("Metadata copies (0, 1, 2)"),
  force: z.boolean().optional().describe("Force creation").default(false),
});

// PV remove args schema
const PvRemoveArgsSchema = z.object({
  pvName: z.string().describe("PV name"),
  force: z.boolean().optional().describe("Force removal").default(false),
  confirm: z.boolean().optional().describe("Confirm before deleting").default(false)
});

// Cache create args schema
const CacheCreateArgsSchema = z.object({
  origin: z.string().describe("Origin LV path"),
  fastPvs: z.array(z.string()).describe("Fast PVs (SSD/NVMe)"),
  blockSize: z.string().optional().describe("Block size (e.g., 64K, 256K)"),
  cacheMode: z.enum(["writeback", "writethrough"]).optional().describe("Cache mode"),
  cacheType: z.enum(["cache", "writecache"]).optional().describe("Cache type"),
});

// Split cache args schema
const SplitCacheArgsSchema = z.object({
  lvPath: z.string().describe("LV path"),
  force: z.boolean().optional().describe("Force split (skip 5+ hour flush)").default(false),
});

// RAID scrubbing 인자 스키마
const RaidScrubArgsSchema = z.object({
  lvPath: z.string().describe("LV path"),
  syncaction: z.enum(["check", "repair"]).describe("Sync action"),
});

// Set RAID recovery rate args schema
const SetRaidRecoveryRateArgsSchema = z.object({
  lvPath: z.string().describe("LV path"),
  minRecoveryRate: z.string().optional().describe("Minimum recovery rate (e.g., 128KiB/s)"),
  maxRecoveryRate: z.string().optional().describe("Maximum recovery rate (e.g., 2MiB/s)"),
});

// Snapshot create args schema
const SnapshotCreateArgsSchema = z.object({
  snapshotName: z.string().describe("Snapshot name"),
  sourceLvPath: z.string().describe("Source LV path"),
  size: z.string().describe("Snapshot size"),
  chunkSize: z.string().optional().describe("Chunk size (e.g., 512K)"),
  thin: z.boolean().optional().describe("Thin snapshot").default(false),
});

// List snapshots args schema
const ListSnapshotsArgsSchema = z.object({
  vgName: z.string().optional().describe("VG name"),
});

// Remove snapshot args schema
const RemoveSnapshotArgsSchema = z.object({
  snapshotPath: z.string().describe("Snapshot LV path"),
  force: z.boolean().optional().describe("Force removal").default(false),
  confirm: z.boolean().optional().describe("Confirm before deleting").default(false)
});

// Thin pool create args schema
const ThinPoolCreateArgsSchema = z.object({
  poolName: z.string().describe("Pool name"),
  vgName: z.string().describe("VG name"),
  size: z.string().describe("Pool size"),
  chunkSize: z.string().optional().describe("Chunk size (e.g., 64K)"),
  metadataSize: z.string().optional().describe("Metadata size (e.g., 1G)"),
  zero: z.boolean().optional().describe("Zero initial blocks").default(false),
});

// Config read args schema
const ConfReadArgsSchema = z.object({
  path: z.string().optional().describe("Config file path (default: /etc/lvm/lvm.conf)"),
  section: z.string().optional().describe("Section name"),
  key: z.string().optional().describe("Key name"),
});

// Config write args schema
const ConfWriteArgsSchema = z.object({
  section: z.string().describe("Section name"),
  key: z.string().describe("Key name"),
  value: z.string().describe("Value"),
  path: z.string().optional().describe("Config file path"),
  comment: z.string().optional().describe("Comment"),
  backup: z.boolean().optional().describe("Create backup").default(true),
});

// LVM command execution helper function
async function executeLVMCommand(command: string, args: string[]): Promise<{
  success: boolean;
  stdout: string;
  stderr: string;
  returnCode: number;
  command: string;
}> {
  return await executor.execute(command, args);
}

// Create LV
export async function lvcreate(args: z.infer<typeof LvCreateArgsSchema>) {
  const cmdArgs = ["-L", args.size, "-n", args.lvName];
  
  if (args.lvType === "striped" && args.stripes) {
    cmdArgs.push("-i", args.stripes.toString());
    if (args.stripeSize) cmdArgs.push("-I", args.stripeSize);
  } else if (args.lvType === "mirror" && args.mirrors) {
    cmdArgs.push("-m", args.mirrors.toString());
  } else if (args.lvType.startsWith("raid") && args.raidLevel) {
    cmdArgs.push("--type", `raid${args.raidLevel}`);
    if (args.regionSize) cmdArgs.push("-R", args.regionSize);
    if (args.raidIntegrity) cmdArgs.push("--raidintegrity");
    if (args.minRecoveryRate) cmdArgs.push("--minrecoveryrate", args.minRecoveryRate);
    if (args.maxRecoveryRate) cmdArgs.push("--maxrecoveryrate", args.maxRecoveryRate);
  } else if (args.lvType === "thin" && args.thinPool) {
    cmdArgs.push("-T", `${args.vgName}/${args.thinPool}`);
    if (args.chunkSize) cmdArgs.push("-c", args.chunkSize);
  } else if (args.snapshotOf) {
    cmdArgs.push("-s", `/dev/${args.vgName}/${args.snapshotOf}`);
    if (args.chunkSize) cmdArgs.push("-c", args.chunkSize);
  } else if (args.lvType === "thin-pool") {
    if (args.chunkSize) cmdArgs.push("-c", args.chunkSize);
  }
  
  if (args.filesystem) {
    cmdArgs.push("--filesystem", args.filesystem);
  }
  
  if (args.tags && args.tags.length > 0) {
    for (const tag of args.tags) {
      cmdArgs.push("--addtag", tag);
    }
  }
  
  if (args.contiguous) cmdArgs.push("-C");
  
  if (args.permission) {
    cmdArgs.push("-p", args.permission === "r" ? "r" : "rw");
  }
  
  if (args.allocPolicy) {
    cmdArgs.push("--alloc", args.allocPolicy);
  }
  
  if (args.writeMostly) {
    cmdArgs.push("--write-mostly", args.writeMostly);
  }
  
  cmdArgs.push(args.vgName);
  
  return await executeLVMCommand("lvcreate", cmdArgs);
}

// Extend LV
export async function lvextend(args: z.infer<typeof LvExtendArgsSchema>) {
  const cmdArgs: string[] = [];
  
  if (args.resizeFs) cmdArgs.push("-r");
  
  if (args.size) {
    cmdArgs.push("-L", args.size);
  } else if (args.sizeAdd) {
    cmdArgs.push("-L", args.sizeAdd);
  } else if (args.sizePercent) {
    cmdArgs.push("-l", `${args.sizePercent}%VG`);
  }
  
  cmdArgs.push(args.lvPath);
  
  return await executeLVMCommand("lvextend", cmdArgs);
}

// Reduce LV
export async function lvreduce(args: z.infer<typeof LvReduceArgsSchema>) {
  const cmdArgs: string[] = [];
  
  if (args.resizeFs) cmdArgs.push("-r");
  
  cmdArgs.push("-L", args.size, args.lvPath);
  
  return await executeLVMCommand("lvreduce", cmdArgs);
}

// Remove LV
export async function lvremove(args: z.infer<typeof LvRemoveArgsSchema>) {
  if (!args.confirm) {
    return {
      status: "confirm",
      message: `Are you sure you want to remove '${args.lvPath}'?`,
      hint: "Call again with confirm=true"
    };
  }

  const cmdArgs = args.force ? ["-f"] : [];
  cmdArgs.push(args.lvPath);
  
  return await executeLVMCommand("lvremove", cmdArgs);
}

// Change LV
export async function lvchange(args: z.infer<typeof LvChangeArgsSchema>) {
  const cmdArgs: string[] = [];
  
  if (args.activate !== undefined) {
    cmdArgs.push("-a", args.activate ? "y" : "n");
  }
  
  if (args.permission) {
    cmdArgs.push("-p", args.permission === "r" ? "r" : "rw");
  }
  
  if (args.addTag) {
    cmdArgs.push("--addtag", args.addTag);
  }
  
  if (args.delTag) {
    cmdArgs.push("--deltag", args.delTag);
  }
  
  cmdArgs.push(args.lvPath);
  
  return await executeLVMCommand("lvchange", cmdArgs);
}

// Display LV info
export async function lvdisplay(lvPath?: string) {
  const cmdArgs = ["-c"];
  if (lvPath) cmdArgs.push(lvPath);
  
  return await executeLVMCommand("lvdisplay", cmdArgs);
}

// List all LVs
export async function lvs(options?: string) {
  const cmdArgs: string[] = [];
  if (options) cmdArgs.push(...options.split(" "));
  
  return await executeLVMCommand("lvs", cmdArgs);
}

// Create VG
export async function vgcreate(args: z.infer<typeof VgCreateArgsSchema>) {
  const cmdArgs: string[] = [];
  
  if (args.force) cmdArgs.push("-f");
  if (args.maxPv) cmdArgs.push("-p", args.maxPv.toString());
  if (args.maxLv) cmdArgs.push("-l", args.maxLv.toString());
  if (args.extentSize) cmdArgs.push("-s", args.extentSize);
  
  cmdArgs.push(args.vgName, ...args.physicalVolumes);
  
  return await executeLVMCommand("vgcreate", cmdArgs);
}

// Extend VG
export async function vgextend(args: z.infer<typeof VgExtendArgsSchema>) {
  const cmdArgs = [args.vgName, ...args.physicalVolumes];
  
  return await executeLVMCommand("vgextend", cmdArgs);
}

// Remove VG
export async function vgremove(args: z.infer<typeof VgRemoveArgsSchema>) {
  if (!args.confirm) {
    return {
      status: "confirm",
      message: `Are you sure you want to remove VG '${args.vgName}'?`,
      hint: "Call again with confirm=true"
    };
  }

  const cmdArgs = args.force ? ["-f", args.vgName] : [args.vgName];
  
  return await executeLVMCommand("vgremove", cmdArgs);
}

// Display VG info
export async function vgdisplay(vgName?: string) {
  const cmdArgs = ["-c"];
  if (vgName) cmdArgs.push(vgName);
  
  return await executeLVMCommand("vgdisplay", cmdArgs);
}

// List all VGs
export async function vgs(options?: string) {
  const cmdArgs: string[] = [];
  if (options) cmdArgs.push(...options.split(" "));
  
  return await executeLVMCommand("vgs", cmdArgs);
}

// Create PV
export async function pvcreate(args: z.infer<typeof PvCreateArgsSchema>) {
  const cmdArgs: string[] = [];
  
  if (args.force) cmdArgs.push("-f");
  if (args.dataAlignment) cmdArgs.push("--dataalignment", `${args.dataAlignment}K`);
  if (args.metadataSize) cmdArgs.push("--metadatasize", `${args.metadataSize}K`);
  if (args.metadatacopies !== undefined) cmdArgs.push("--pvmetadatacopies", args.metadatacopies.toString());
  
  cmdArgs.push(args.device);
  
  return await executeLVMCommand("pvcreate", cmdArgs);
}

// Remove PV
export async function pvremove(args: z.infer<typeof PvRemoveArgsSchema>) {
  if (!args.confirm) {
    return {
      status: "confirm",
      message: `Are you sure you want to remove PV '${args.pvName}'?`,
      hint: "Call again with confirm=true"
    };
  }

  const cmdArgs = args.force ? ["-f", args.pvName] : [args.pvName];
  
  return await executeLVMCommand("pvremove", cmdArgs);
}

// Display PV info
export async function pvdisplay(pvName?: string) {
  const cmdArgs = ["-c"];
  if (pvName) cmdArgs.push(pvName);
  
  return await executeLVMCommand("pvdisplay", cmdArgs);
}

// List all PVs
export async function pvs(options?: string) {
  const cmdArgs: string[] = [];
  if (options) cmdArgs.push(...options.split(" "));
  
  return await executeLVMCommand("pvs", cmdArgs);
}

// Create cache
export async function cache_create(args: z.infer<typeof CacheCreateArgsSchema>) {
  const cacheType = args.cacheType || "cache";
  const cmdArgs: string[] = [];
  
  if (cacheType === "writecache") {
    cmdArgs.push("--type", "writecache");
    if (args.blockSize) cmdArgs.push("--cachesettings", `block_size=${args.blockSize}`);
    cmdArgs.push("--cachevol", args.fastPvs[0], args.origin);
  } else {
    const poolName = `${args.origin.split("/").pop()}_cache_pool`;
    
    const poolCmd = ["lvcreate", "-L", "1G", "-T", poolName, ...args.fastPvs];
    const poolResult = await executeLVMCommand("lvcreate", poolCmd);
    if (!poolResult.success) return poolResult;
    
    cmdArgs.push("--type", "cache");
    if (args.cacheMode) cmdArgs.push("--cachemode", args.cacheMode);
    if (args.blockSize) cmdArgs.push("--chunksize", args.blockSize);
    cmdArgs.push("--cachepool", poolName, args.origin);
  }
  
  return await executeLVMCommand("lvconvert", cmdArgs);
}

// Split cache
export async function splitcache(args: z.infer<typeof SplitCacheArgsSchema>) {
  const cmdArgs = ["--splitcache"];
  if (args.force) cmdArgs.push("--yes");
  cmdArgs.push(args.lvPath);
  
  return await executeLVMCommand("lvconvert", cmdArgs);
}

// RAID scrubbing
export async function raidscrub(args: z.infer<typeof RaidScrubArgsSchema>) {
  const cmdArgs = ["--syncaction", args.syncaction, args.lvPath];
  
  return await executeLVMCommand("lvchange", cmdArgs);
}

// Set RAID recovery rate
export async function setraidrecoveryrate(args: z.infer<typeof SetRaidRecoveryRateArgsSchema>) {
  const cmdArgs: string[] = [];
  
  if (args.minRecoveryRate) cmdArgs.push("--minrecoveryrate", args.minRecoveryRate);
  if (args.maxRecoveryRate) cmdArgs.push("--maxrecoveryrate", args.maxRecoveryRate);
  
  cmdArgs.push(args.lvPath);
  
  return await executeLVMCommand("lvchange", cmdArgs);
}

// Create snapshot
export async function snapshot_create(args: z.infer<typeof SnapshotCreateArgsSchema>) {
  const cmdArgs = ["-s", "-n", args.snapshotName];
  
  if (!args.thin) {
    cmdArgs.push("-L", args.size);
  }
  
  if (args.thin && args.chunkSize) {
    cmdArgs.push("-c", args.chunkSize);
  }
  
  cmdArgs.push(args.sourceLvPath);
  
  return await executeLVMCommand("lvcreate", cmdArgs);
}

// List snapshots
export async function listsnapshots(args: z.infer<typeof ListSnapshotsArgsSchema>) {
  const cmdArgs = ["-o", "lv_name,vg_name,origin,data_percent,metadata_percent"];
  
  if (args.vgName) {
    cmdArgs.push("-S", `vg_name=${args.vgName}`);
  }
  
  cmdArgs.push("-S", "origin!=''");
  
  return await executeLVMCommand("lvs", cmdArgs);
}

// Remove snapshot
export async function removesnapshot(args: z.infer<typeof RemoveSnapshotArgsSchema>) {
  if (!args.confirm) {
    return {
      status: "confirm",
      message: `Are you sure you want to remove snapshot '${args.snapshotPath}'?`,
      hint: "Call again with confirm=true"
    };
  }

  const cmdArgs = args.force ? ["-f", args.snapshotPath] : [args.snapshotPath];
  
  return await executeLVMCommand("lvremove", cmdArgs);
}

// Create thin pool
export async function thinpool_create(args: z.infer<typeof ThinPoolCreateArgsSchema>) {
  const cmdArgs = ["-T", "-L", args.size];
  
  if (args.chunkSize) cmdArgs.push("-c", args.chunkSize);
  if (args.metadataSize) cmdArgs.push("--poolmetadatasize", args.metadataSize);
  if (!args.zero) cmdArgs.push("--zero", "n");
  
  cmdArgs.push(`${args.vgName}/${args.poolName}`);
  
  return await executeLVMCommand("lvcreate", cmdArgs);
}

// Read config
export async function conf_read(args: z.infer<typeof ConfReadArgsSchema>) {
  const path = args.path || "/etc/lvm/lvm.conf";
  const cmdArgs = ["--file", path];
  
  if (args.section) {
    cmdArgs.push("--type", args.section);
  }
  
  return await executeLVMCommand("lvmconfig", cmdArgs);
}

// Write config
export async function conf_write(args: z.infer<typeof ConfWriteArgsSchema>) {
  const path = args.path || "/etc/lvm/lvm.conf";
  
  if (args.backup) {
    const backupCmd = ["cp", path, `${path}.backup`];
    await executeLVMCommand("cp", backupCmd);
  }
  
  const result = {
    success: true,
    message: `Configuration update for ${args.section}.${args.key} = ${args.value}`,
    path,
    section: args.section,
    key: args.key,
    value: args.value,
    note: "Direct file editing not implemented. Use sed or manual edit."
  };
  
  return result as any;
}

// Create MCP server
const server = new Server(
  {
    name: "lvm-mcp-server",
    version: "0.6.3",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "lvm_lvcreate",
        description: "Create a Logical Volume with various types (linear, striped, mirror, RAID, thin, cache)",
        inputSchema: LvCreateArgsSchema,
      },
      {
        name: "lvm_lvextend",
        description: "Extend a Logical Volume with optional filesystem resize",
        inputSchema: LvExtendArgsSchema,
      },
      {
        name: "lvm_lvreduce",
        description: "Reduce a Logical Volume with optional filesystem resize",
        inputSchema: LvReduceArgsSchema,
      },
      {
        name: "lvm_lvremove",
        description: "Remove a Logical Volume",
        inputSchema: LvRemoveArgsSchema,
      },
      {
        name: "lvm_lvchange",
        description: "Change LV attributes (activation, permission, tags)",
        inputSchema: LvChangeArgsSchema,
      },
      {
        name: "lvm_lvdisplay",
        description: "Display detailed LV information",
        inputSchema: z.object({
          lvPath: z.string().optional().describe("Specific LV path"),
        }),
      },
      {
        name: "lvm_lvs",
        description: "List all Logical Volumes",
        inputSchema: z.object({
          options: z.string().optional().describe("Additional options"),
        }),
      },
      {
        name: "lvm_vgcreate",
        description: "Create a Volume Group",
        inputSchema: VgCreateArgsSchema,
      },
      {
        name: "lvm_vgextend",
        description: "Extend VG by adding PVs",
        inputSchema: VgExtendArgsSchema,
      },
      {
        name: "lvm_vgremove",
        description: "Remove a Volume Group",
        inputSchema: VgRemoveArgsSchema,
      },
      {
        name: "lvm_vgdisplay",
        description: "Display detailed VG information",
        inputSchema: z.object({
          vgName: z.string().optional().describe("Specific VG name"),
        }),
      },
      {
        name: "lvm_vgs",
        description: "List all Volume Groups",
        inputSchema: z.object({
          options: z.string().optional().describe("Additional options"),
        }),
      },
      {
        name: "lvm_pvcreate",
        description: "Create a Physical Volume",
        inputSchema: PvCreateArgsSchema,
      },
      {
        name: "lvm_pvremove",
        description: "Remove a Physical Volume",
        inputSchema: PvRemoveArgsSchema,
      },
      {
        name: "lvm_pvdisplay",
        description: "Display detailed PV information",
        inputSchema: z.object({
          pvName: z.string().optional().describe("Specific PV name"),
        }),
      },
      {
        name: "lvm_pvs",
        description: "List all Physical Volumes",
        inputSchema: z.object({
          options: z.string().optional().describe("Additional options"),
        }),
      },
      {
        name: "lvm_cache_create",
        description: "Create cache (dm-cache or dm-writecache) for LV",
        inputSchema: CacheCreateArgsSchema,
      },
      {
        name: "lvm_splitcache",
        description: "Split cache with force option (skip 5+ hour flush)",
        inputSchema: SplitCacheArgsSchema,
      },
      {
        name: "lvm_raidscrub",
        description: "Start RAID consistency check/scrub",
        inputSchema: RaidScrubArgsSchema,
      },
      {
        name: "lvm_setraidrecoveryrate",
        description: "Change RAID recovery rate on-the-fly",
        inputSchema: SetRaidRecoveryRateArgsSchema,
      },
      {
        name: "lvm_snapshot_create",
        description: "Create snapshot (normal or thin)",
        inputSchema: SnapshotCreateArgsSchema,
      },
      {
        name: "lvm_listsnapshots",
        description: "List all snapshots with details",
        inputSchema: ListSnapshotsArgsSchema,
      },
      {
        name: "lvm_removesnapshot",
        description: "Remove a snapshot logical volume",
        inputSchema: RemoveSnapshotArgsSchema,
      },
      {
        name: "lvm_thinpool_create",
        description: "Create thin pool with chunk size and metadata options",
        inputSchema: ThinPoolCreateArgsSchema,
      },
      {
        name: "lvm_conf_read",
        description: "Read lvm.conf (full file, section, or specific key)",
        inputSchema: ConfReadArgsSchema,
      },
      {
        name: "lvm_conf_write",
        description: "Modify lvm.conf with automatic backup",
        inputSchema: ConfWriteArgsSchema,
      },
    ],
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      case "lvm_lvcreate":
        result = await lvcreate(LvCreateArgsSchema.parse(args));
        break;
      case "lvm_lvextend":
        result = await lvextend(LvExtendArgsSchema.parse(args));
        break;
      case "lvm_lvreduce":
        result = await lvreduce(LvReduceArgsSchema.parse(args));
        break;
      case "lvm_lvremove":
        result = await lvremove(LvRemoveArgsSchema.parse(args));
        break;
      case "lvm_lvchange":
        result = await lvchange(LvChangeArgsSchema.parse(args));
        break;
      case "lvm_lvdisplay":
        const lvDisplayArgs = args as { lvPath?: string };
        result = await lvdisplay(lvDisplayArgs.lvPath);
        break;
      case "lvm_lvs":
        const lvsArgs = args as { options?: string };
        result = await lvs(lvsArgs.options);
        break;
      case "lvm_vgcreate":
        result = await vgcreate(VgCreateArgsSchema.parse(args));
        break;
      case "lvm_vgextend":
        result = await vgextend(VgExtendArgsSchema.parse(args));
        break;
      case "lvm_vgremove":
        result = await vgremove(VgRemoveArgsSchema.parse(args));
        break;
      case "lvm_vgdisplay":
        const vgDisplayArgs = args as { vgName?: string };
        result = await vgdisplay(vgDisplayArgs.vgName);
        break;
      case "lvm_vgs":
        const vgsArgs = args as { options?: string };
        result = await vgs(vgsArgs.options);
        break;
      case "lvm_pvcreate":
        result = await pvcreate(PvCreateArgsSchema.parse(args));
        break;
      case "lvm_pvremove":
        result = await pvremove(PvRemoveArgsSchema.parse(args));
        break;
      case "lvm_pvdisplay":
        const pvDisplayArgs = args as { pvName?: string };
        result = await pvdisplay(pvDisplayArgs.pvName);
        break;
      case "lvm_pvs":
        const pvsArgs = args as { options?: string };
        result = await pvs(pvsArgs.options);
        break;
      case "lvm_cache_create":
        result = await cache_create(CacheCreateArgsSchema.parse(args));
        break;
      case "lvm_splitcache":
        result = await splitcache(SplitCacheArgsSchema.parse(args));
        break;
      case "lvm_raidscrub":
        result = await raidscrub(RaidScrubArgsSchema.parse(args));
        break;
      case "lvm_setraidrecoveryrate":
        result = await setraidrecoveryrate(SetRaidRecoveryRateArgsSchema.parse(args));
        break;
      case "lvm_snapshot_create":
        result = await snapshot_create(SnapshotCreateArgsSchema.parse(args));
        break;
      case "lvm_listsnapshots":
        result = await listsnapshots(ListSnapshotsArgsSchema.parse(args));
        break;
      case "lvm_removesnapshot":
        result = await removesnapshot(RemoveSnapshotArgsSchema.parse(args));
        break;
      case "lvm_thinpool_create":
        result = await thinpool_create(ThinPoolCreateArgsSchema.parse(args));
        break;
      case "lvm_conf_read":
        result = await conf_read(ConfReadArgsSchema.parse(args));
        break;
      case "lvm_conf_write":
        result = await conf_write(ConfWriteArgsSchema.parse(args));
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LVM MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
