import chokidar from 'chokidar';
import { generateRoutes } from './generateRoutes';

export function startWatcher({
								 featuresDir,
								 appDir,
								 excludePrefix,
								 include,
								 extensions,
								 ignorePatterns = [],
							 }: {
	featuresDir: string;
	appDir: string;
	excludePrefix: string;
	include: string[];
	extensions: string[];
	ignorePatterns?: string[];
}) {
	// Initial sync - this will be incremental by default
	const sync = () =>
		generateRoutes({
			featuresDir,
			appDir,
			excludePrefix,
			include,
			extensions,
			ignorePatterns,
			forceClean: false // Ensure incremental mode
		});

	const watcher = chokidar.watch(featuresDir, {
		ignored: /(^|[/\\])\../,
		ignoreInitial: true, // Changed to true to avoid initial flood
		persistent: true,
	});

	// Do initial sync before starting to watch
	console.log(`🔄 Initial sync...`);
	sync();
	console.log(`👀 Watching ${featuresDir} for changes...`);

	watcher.on('all', (event, path) => {
		console.log(`🔄 [${event}] Changed: ${path}`);
		sync();
	});
}
