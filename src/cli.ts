import { program } from "commander";
import path from "path";
import fs from "fs";
import { generateRoutes } from "./generateRoutes";
import { startWatcher } from "./watcher";

function loadConfig(configPath?: string): any {
    const resolvedPath = configPath
        ? path.resolve(configPath)
        : path.resolve(process.cwd(), "expo-router-autogen.config.js");

    if (!fs.existsSync(resolvedPath)) return {};

    if (resolvedPath.endsWith(".json")) {
        return JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
    }

    return require(resolvedPath);
}

program
    .option("--features <path>", "Path to features directory")
    .option("--app <path>", "Path to app directory")
    .option("--excludePrefix <prefix>", "Exclude folders/files with this prefix")
    .option("--include <list>", "Comma-separated list of file names to always include")
    .option("--extensions <list>", "Comma-separated list of valid extensions")
    .option("--ignorePatterns <list>", "Comma-separated list of glob patterns to ignore")
    .option("--watch", "Enable watch mode")
    .option("--verbose", "Enable verbose logging")
    .option("--dry-run", "Enable dry run mode (no file writes)")
    .option("--config <path>", "Path to JSON or JS config file")
    .action((opts) => {
        const cliOptions = opts;
        const fileConfig = loadConfig(cliOptions.config);

        const featuresDir = cliOptions.features || fileConfig.featuresDir || "src/features";
        const appDir = cliOptions.app || fileConfig.appDir || "src/app";

        if (path.resolve(appDir).startsWith(path.resolve(featuresDir))) {
            console.error("❌ appDir cannot be inside featuresDir. This would overwrite source files.");
            process.exit(1);
        }

        const args = {
            featuresDir,
            appDir,
            excludePrefix: cliOptions.excludePrefix || fileConfig.excludePrefix || "_",
            include: (cliOptions.include ? cliOptions.include.split(",") : fileConfig.include) || ["_layout.tsx"],
            extensions: (cliOptions.extensions ? cliOptions.extensions.split(",") : fileConfig.extensions) || [
                ".tsx",
                ".ts",
                ".js",
                ".jsx",
            ],
            ignorePatterns: (cliOptions.ignorePatterns ? cliOptions.ignorePatterns.split(",") : fileConfig.ignorePatterns) || [],
            watch: cliOptions.watch || false,
            verbose: cliOptions.verbose || false,
            dryRun: cliOptions.dryRun || false,
        };

        if (args.watch) {
            startWatcher(args);
        } else {
            generateRoutes(args);
            if (args.verbose) {
                console.log("✅ Routes generated.");
            }
        }
    });

program.parse(process.argv);
