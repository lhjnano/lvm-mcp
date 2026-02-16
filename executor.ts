export interface LVMCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  returnCode: number;
  command: string;
}

export interface LVMExecutor {
  execute(command: string, args: string[]): Promise<LVMCommandResult>;
}

export class DefaultExecutor implements LVMExecutor {
  async execute(command: string, args: string[]): Promise<LVMCommandResult> {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    const fullCommand = `${command} ${args.join(" ")}`;
    
    try {
      const { stdout, stderr } = await execAsync(fullCommand);
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        returnCode: 0,
        command: fullCommand,
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout?.trim() || "",
        stderr: error.stderr?.trim() || error.message,
        returnCode: error.code || -1,
        command: fullCommand,
      };
    }
  }
}
