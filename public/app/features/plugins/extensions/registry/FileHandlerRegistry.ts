import { ReplaySubject } from 'rxjs';

import { PluginExtensionEventHelpers, PluginExtensionFileHandlerConfig } from '@grafana/data/src/types/pluginExtensions';

import * as errors from '../errors';

import { PluginExtensionConfigs, Registry, RegistryType } from './Registry';

const logPrefix = 'Could not register link extension. Reason:';

export type FileHandlerRegistryItem<Context extends object = object> = {
  pluginId: string;
  extensionPointId: string;
  title: string;
  description?: string;
  onFile: (file: File, helpers: PluginExtensionEventHelpers<Context>) => void;
};

export class FileHandlerRegistry extends Registry<FileHandlerRegistryItem[], PluginExtensionFileHandlerConfig> {
  constructor(
    options: {
      registrySubject?: ReplaySubject<RegistryType<FileHandlerRegistryItem[]>>;
      initialState?: RegistryType<FileHandlerRegistryItem[]>;
    } = {}
  ) {
    super(options);
  }

  mapToRegistry(
    registry: RegistryType<FileHandlerRegistryItem[]>,
    item: PluginExtensionConfigs<PluginExtensionFileHandlerConfig>
  ): RegistryType<FileHandlerRegistryItem[]> {
    const { pluginId, configs } = item;

    for (const config of configs) {
      const { title, description, targets, onFile } = config;
      const configLog = this.logger.child({
        description: description ?? '',
        title,
        pluginId,
        onFile: typeof onFile,
      });

      if (!title) {
        configLog.error(`${logPrefix} ${errors.TITLE_MISSING}`);
        continue;
      }

      const extensionPointIds = Array.isArray(targets) ? targets : [targets];

      for (const extensionPointId of extensionPointIds) {
        const pointIdLog = configLog.child({ extensionPointId });
        const { targets, ...registryItem } = config;

        if (!(extensionPointId in registry)) {
          registry[extensionPointId] = [];
        }

        pointIdLog.debug('File handler extension successfully registered');

        registry[extensionPointId].push({ ...registryItem, pluginId, extensionPointId });
      }
    }

    return registry;
  }

  // Returns a read-only version of the registry.
  readOnly() {
    return new FileHandlerRegistry({
      registrySubject: this.registrySubject,
    });
  }
}
