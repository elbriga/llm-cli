import * as child_process from "child_process";

import { ToolInterface } from "../tools.ts";

export class NpmInstall implements ToolInterface {
  getDescription(): object {
    return {
      name: "npm_install",
      description:
        "Install npm packages. Can install specific packages or all dependencies from package.json",
      parameters: {
        type: "object",
        properties: {
          packages: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of package names to install (e.g., ['express', 'lodash']). If empty, installs all dependencies from package.json",
          },
          dev: {
            type: "boolean",
            description:
              "Whether to install as dev dependencies (default: false)",
          },
          global: {
            type: "boolean",
            description: "Whether to install globally (default: false)",
          },
        },
        required: [],
      },
    };
  }

  execute(args: any): string {
    try {
      // Handle parameters with defaults
      let packages = args.packages || [];
      const dev = args.dev || false;
      const global = args.global || false;

      // If packages is a string, convert to array
      if (typeof packages === "string") {
        packages = [packages];
      }

      let command = "npm install";

      if (global) {
        command = "npm install -g";
        // Global installs ignore dev flag
      } else if (dev) {
        command += " --save-dev";
      }

      if (Array.isArray(packages) && packages.length > 0) {
        // Install specific packages
        const packageList = packages.join(" ");
        command += ` ${packageList}`;
      }

      // Execute command
      const result = child_process.execSync(command, {
        cwd: process.cwd(),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Check if there were any errors (stderr is captured in result)
      // execSync throws on non-zero exit, so if we reach here, it likely succeeded

      if (Array.isArray(packages) && packages.length > 0) {
        return `Successfully installed packages: ${packages.join(", ")}`;
      } else {
        return "Successfully installed all dependencies from package.json";
      }
    } catch (error: any) {
      // Extract error message
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error.stderr) {
        errorMessage = error.stderr.toString();
      } else {
        errorMessage = String(error);
      }

      return `ERROR: ${errorMessage}`;
    }
  }
}
