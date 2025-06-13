import chokidar from 'chokidar';
import { generateRoutes } from './generateRoutes';

export function startWatcher({
  featuresDir,
  appDir,
  excludePrefix,
  include,
  extensions
}: {
  featuresDir: string;
  appDir: string;
  excludePrefix: string;
  include: string[];
  extensions: string[];
}) {
  const sync = () =>
    generateRoutes({ featuresDir, appDir, excludePrefix, include, extensions });

  const watcher = chokidar.watch(featuresDir, {
    ignored: /(^|[/\\])\../,
    ignoreInitial: false,
    persistent: true,
  });

  watcher.on('all', (event, path) => {
    console.log(`🔄 [${event}] Changed: ${path}`);
    sync();
  });

  console.log(`👀 Watching ${featuresDir} for changes...`);
}
