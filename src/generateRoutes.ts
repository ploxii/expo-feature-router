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

export function generateRoutes({
	featuresDir,
	appDir,
	excludePrefix,
	include,
	extensions,
	ignorePatterns = [],
}: {
	featuresDir: string
	appDir: string
	excludePrefix: string
	include: string[]
	extensions: string[]
	ignorePatterns?: string[]
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

	function walk(srcDir: string, targetDir: string) {
		const entries = fs.readdirSync(srcDir, { withFileTypes: true })

		for (const entry of entries) {
			if (shouldIgnore(entry.name, excludePrefix, include, ignorePatterns)) continue

			const srcPath = path.join(srcDir, entry.name)
			const targetPath = path.join(targetDir, entry.name)

			if (entry.isDirectory()) {
				walk(srcPath, targetPath)
			} else if (isPageFile(entry.name, extensions)) {
				fs.ensureDirSync(targetDir)
				const importPath = resolveImport(srcPath, targetDir)
				fs.writeFileSync(targetPath, `export { default } from '${importPath}';\n`)
			}
		}
	}

	fs.emptyDirSync(appDir)
	walk(featuresDir, appDir)
}
