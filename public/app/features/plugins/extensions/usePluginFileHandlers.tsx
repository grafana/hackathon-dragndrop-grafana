import { useMemo } from 'react';
import { useObservable } from 'react-use';

import { PluginExtensionTypes, usePluginContext } from '@grafana/data';
import {
  UsePluginFileHandlerResult,
  UsePluginFileHandlersOptions,
} from '@grafana/runtime/src/services/pluginExtensions/getPluginExtensions';

import { useFileHandlerRegistry } from './ExtensionRegistriesContext';
import * as errors from './errors';
import { log } from './logs/log';
import { useLoadAppPlugins } from './useLoadAppPlugins';
import {
  createOpenModalFunction,
  generateExtensionId,
  getExtensionPointPluginDependencies,
  getReadOnlyProxy,
  isGrafanaDevMode,
} from './utils';
import { isExtensionPointIdValid, isExtensionPointMetaInfoMissing } from './validators';
import { PluginExtensionFileHandler } from '@grafana/data/src/types/pluginExtensions';

// Returns an array of component extensions for the given extension point
export function usePluginFileHandlers({
  extensionPointId,
  context,
}: UsePluginFileHandlersOptions): UsePluginFileHandlerResult {
  const registry = useFileHandlerRegistry();
  const pluginContext = usePluginContext();
  const registryState = useObservable(registry.asObservable());
  const { isLoading: isLoadingAppPlugins } = useLoadAppPlugins(getExtensionPointPluginDependencies(extensionPointId));

  return useMemo(() => {
    // For backwards compatibility we don't enable restrictions in production or when the hook is used in core Grafana.
    const enableRestrictions = isGrafanaDevMode() && pluginContext !== null;
    const pluginId = pluginContext?.meta.id ?? '';
    const pointLog = log.child({
      pluginId,
      extensionPointId,
    });

    if (enableRestrictions && !isExtensionPointIdValid({ extensionPointId, pluginId })) {
      pointLog.error(errors.INVALID_EXTENSION_POINT_ID);
      return {
        isLoading: false,
        fileHandlers: [],
      };
    }

    if (enableRestrictions && isExtensionPointMetaInfoMissing(extensionPointId, pluginContext)) {
      pointLog.error(errors.EXTENSION_POINT_META_INFO_MISSING);
      return {
        isLoading: false,
        fileHandlers: [],
      };
    }

    if (isLoadingAppPlugins) {
      return {
        isLoading: true,
        fileHandlers: [],
      };
    }

    if (!registryState || !registryState[extensionPointId]) {
      return {
        isLoading: false,
        fileHandlers: [],
      };
    }

    const frozenContext = context ? getReadOnlyProxy(context) : {};
    const extensions: PluginExtensionFileHandler[] = [];
    const extensionsByPlugin: Record<string, number> = {};

    for (const fileHandler of registryState[extensionPointId] ?? []) {
      const { pluginId } = fileHandler;

      if (extensionsByPlugin[pluginId] === undefined) {
        extensionsByPlugin[pluginId] = 0;
      }

      const extension: PluginExtensionFileHandler = {
        id: generateExtensionId(pluginId, extensionPointId, fileHandler.title),
        type: PluginExtensionTypes.fileHandler,
        pluginId: pluginId,
        onFile: (file: File) =>
          fileHandler.onFile(file, { openModal: createOpenModalFunction(pluginId), context: frozenContext }),
        title: fileHandler.title,
        description: fileHandler.description || '',
      };

      extensions.push(extension);
      extensionsByPlugin[pluginId] += 1;
    }

    return {
      isLoading: false,
      fileHandlers: extensions,
    };
  }, [context, extensionPointId, registryState, pluginContext, isLoadingAppPlugins]);
}
