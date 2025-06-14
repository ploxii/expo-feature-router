import fs from "fs-extra"
import path from "path"
import ts from "typescript"
import * as tsconfigPaths from "tsconfig-paths"

function isPageFile(file: string, extensions: string[]) {
	return extensions.includes(path.extname(file))
}

function shouldIgnore(name: string, excludePrefix: string, include: string[], ignorePatterns: string[]) {
	if (name.startsWith(excludePrefix) && !include.includes(name)) return true
	for (const pattern of ignorePatterns) {
		// Convert simple glob to regex (very basic)
		const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") + "$")
		if (regex.test(name)) return true
	}
	return false
}

function getExpectedContent(importPath: string): string {
	return `export { default } from '${importPath}';\n`
}

function needsUpdate(targetPath: string, expectedContent: string): boolean {
	if (!fs.existsSync(targetPath)) return true

	try {
		const currentContent = fs.readFileSync(targetPath, 'utf8')
		return currentContent !== expectedContent
	} catch {
		return true
	}
}

export function generateRoutes({
								   featuresDir,
								   appDir,
								   excludePrefix,
								   include,
								   extensions,
								   ignorePatterns = [],
								   forceClean = false, // New option to force clean rebuild
							   }: {
	featuresDir: string
	appDir: string
	excludePrefix: string
	include: string[]
	extensions: string[]
	ignorePatterns?: string[]
	forceClean?: boolean
}) {
	// --- Load tsconfig and setup path matcher ---
	const tsconfigPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json")
	let matchPath: null | ((requestedPath: string) => string | undefined) = null
	if (tsconfigPath) {
		const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
		const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath))
		const baseUrl = parsedConfig.options.baseUrl
			? path.resolve(path.dirname(tsconfigPath), parsedConfig.options.baseUrl)
			: undefined
		const paths = parsedConfig.options.paths
		if (baseUrl && paths) {
			matchPath = tsconfigPaths.createMatchPath(baseUrl, paths)
		}
	}

	function resolveImport(importPath: string, currentDir: string) {
		// Use tsconfig paths matcher if available
		if (matchPath) {
			const resolved = matchPath(importPath)
			if (resolved) {
				// Make path relative to currentDir
				let rel = path.relative(currentDir, resolved)
				if (!rel.startsWith(".")) rel = "./" + rel
				// Remove extension for import compatibility
				rel = rel.replace(/\.(tsx|ts|jsx|js)$/, "")
				return rel.replace(/\\/g, "/")
			}
		}
		// fallback: relative path from currentDir
		let rel = path.relative(currentDir, importPath)
		if (!rel.startsWith(".")) rel = "./" + rel
		rel = rel.replace(/\.(tsx|ts|jsx|js)$/, "")
		return rel.replace(/\\/g, "/")
	}

	// Track all valid target files that should exist
	const validTargetFiles = new Set<string>()

	function walk(srcDir: string, targetDir: string) {
		const entries = fs.readdirSync(srcDir, { withFileTypes: true })

		for (const entry of entries) {
			if (shouldIgnore(entry.name, excludePrefix, include, ignorePatterns)) continue

			const srcPath = path.join(srcDir, entry.name)
			const targetPath = path.join(targetDir, entry.name)

			if (entry.isDirectory()) {
				walk(srcPath, targetPath)
			} else if (isPageFile(entry.name, extensions)) {
				validTargetFiles.add(targetPath)

				const importPath = resolveImport(srcPath, targetDir)
				const expectedContent = getExpectedContent(importPath)

				if (needsUpdate(targetPath, expectedContent)) {
					fs.ensureDirSync(targetDir)
					fs.writeFileSync(targetPath, expectedContent)
					console.log(`📝 Updated: ${path.relative(process.cwd(), targetPath)}`)
				}
			}
		}
	}

	// Clean up orphaned files - files that exist in target but no longer have a source
	function cleanupOrphanedFiles(dir: string) {
		if (!fs.existsSync(dir)) return

		const entries = fs.readdirSync(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				cleanupOrphanedFiles(fullPath)
				// Remove empty directories
				try {
					const dirContents = fs.readdirSync(fullPath)
					if (dirContents.length === 0) {
						fs.rmdirSync(fullPath)
						console.log(`🗑️  Removed empty directory: ${path.relative(process.cwd(), fullPath)}`)
					}
				} catch {
					// Directory might not be empty or might have been removed already
				}
			} else {
				// Check if this file should still exist
				if (!validTargetFiles.has(fullPath)) {
					fs.unlinkSync(fullPath)
					console.log(`🗑️  Removed orphaned file: ${path.relative(process.cwd(), fullPath)}`)
				}
			}
		}
	}

	// Force clean rebuild if requested
	if (forceClean) {
		fs.emptyDirSync(appDir)
		console.log(`🧹 Cleaned target directory: ${appDir}`)
	}

	// Generate/update files
	walk(featuresDir, appDir)

	// Clean up orphaned files (only if not doing force clean, as that already emptied everything)
	if (!forceClean) {
		cleanupOrphanedFiles(appDir)
	}
}
