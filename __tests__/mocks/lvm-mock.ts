import type { LVMExecutor, LVMCommandResult } from "../../executor.js";

export type { LVMCommandResult };

/**
 * LVM command execution mock
 */
export class MockLVMExecutor implements LVMExecutor {
  private commands: Map<string, LVMCommandResult>;

  constructor() {
    this.commands = new Map();
  }

  /**
   * Set response for a command
   */
  setCommand(command: string, result: LVMCommandResult): void {
    this.commands.set(command, result);
  }

  /**
   * Execute command (mock)
   */
  async execute(command: string, args: string[]): Promise<LVMCommandResult> {
    const fullCommand = `${command} ${args.join(" ")}`;

    // Exact match
    if (this.commands.has(fullCommand)) {
      return this.commands.get(fullCommand)!;
    }

    // Pattern match (command only)
    for (const [cmdPattern, result] of this.entries()) {
      if (cmdPattern.startsWith(command) && args.some(arg => cmdPattern.includes(arg))) {
        return {
          ...result,
          command: fullCommand
        };
      }
    }

    // Default success response
    return {
      success: true,
      stdout: `${command} executed successfully`,
      stderr: "",
      returnCode: 0,
      command: fullCommand,
    };
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
  }

  /**
   * Map entries
   */
  entries(): IterableIterator<[string, LVMCommandResult]> {
    return this.commands.entries();
  }
}

/**
 * Print PV display sample
 */
export const SAMPLE_PVDISPLAY_OUTPUT = `
  /dev/sdb1:vg0:lvm2:a--:1024.00g:1024.00g:1024:1024:0
  /dev/sdc1:vg0:lvm2:a--:1024.00g:1024.00g:1024:1024:0
`;

/**
 * Print VG display sample
 */
export const SAMPLE_VGDISPLAY_OUTPUT = `
  vg0:lvm2:rw:10:1:2:j--n:2048.00g:1024.00g:4.00m:2:2:1
`;

/**
 * Print LV display sample
 */
export const SAMPLE_LVDISPLAY_OUTPUT = `
  /dev/vg0/data:vg0:-wi-a-----:10.00g:1:1
  /dev/vg0/stripe_test:vg0:-wi-a-----:50.00g:4:4
`;

/**
 * LVS sample output
 */
export const SAMPLE_LVS_OUTPUT = `
  LV           VG   Attr       LSize   Pool Origin Data%  Meta%
  data         vg0  -wi-a-----   10.00g
  stripe_test  vg0  -wi-a-----  50.00g
  raid5_data   vg0  -wi-ao----  100.00g
`;

/**
 * Snapshot sample output
 */
export const SAMPLE_SNAPSHOTS_OUTPUT = `
  LV            VG   Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  data_snap     vg0  Vwi-a-tz--   5.00g      data   10.00
`;

/**
 * Cache statistics sample output
 */
export const SAMPLE_CACHE_STATS_OUTPUT = `
  LV            VG   Attr       LSize   Pool Origin Data%  Meta%  Cache   Mode
  cached_data   vg0  Cwi-ao----  100.00g      fast   50.00          writethrough
`;

/**
 * Configuration sample output
 */
export const SAMPLE_LVMCONFIG_OUTPUT = `
  devices {
    dir="/dev"
    filter=[ "a|^/dev/sda.*$", "r/.*/" ]
    scan="/dev"
  }
  
  allocation {
    stripe_size=64k
  }
  
  activation {
    auto_activation_volume_list=["vg0"]
  }
`;

/**
 * Successful command result generator
 */
export function createSuccessResult(stdout: string = "Success"): LVMCommandResult {
  return {
    success: true,
    stdout,
    stderr: "",
    returnCode: 0,
    command: "mock command",
  };
}

/**
 * Failed command result generator
 */
export function createErrorResult(
  stderr: string = "Command failed",
  returnCode: number = 1
): LVMCommandResult {
  return {
    success: false,
    stdout: "",
    stderr,
    returnCode,
    command: "mock command",
  };
}

/**
 * Argument validation utility
 */
export function expectCommandArgs(
  args: string[],
  expected: { flag?: string; value?: string; hasValue?: boolean }[]
): void {
  for (const exp of expected) {
    if (exp.flag) {
      const idx = args.indexOf(exp.flag);
      if (idx === -1) {
        throw new Error(`Expected flag "${exp.flag}" not found`);
      }

      if (exp.hasValue && idx + 1 >= args.length) {
        throw new Error(`Flag "${exp.flag}" requires a value`);
      }

      if (exp.value && args[idx + 1] !== exp.value) {
        throw new Error(
          `Expected value "${exp.value}" for flag "${exp.flag}", got "${args[idx + 1]}"`
        );
      }
    }
  }
}
