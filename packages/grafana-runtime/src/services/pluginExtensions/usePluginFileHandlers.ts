import { UsePluginFileHandlerResult, UsePluginFileHandlersOptions } from './getPluginExtensions';

export type UsePluginFileHandlers = (options: UsePluginFileHandlersOptions) => UsePluginFileHandlerResult;

let singleton: UsePluginFileHandlers | undefined;

export function setPluginFileHandlersHook(hook: UsePluginFileHandlers): void {
  // We allow overriding the registry in tests
  if (singleton && process.env.NODE_ENV !== 'test') {
    throw new Error('setFileHandlersHook() function should only be called once, when Grafana is starting.');
  }
  singleton = hook;
}

export function usePluginFileHandlers(options: UsePluginFileHandlersOptions): UsePluginFileHandlerResult {
  if (!singleton) {
    throw new Error('setUseFileHandlersOptions(options) can only be used after the Grafana instance has started.');
  }
  return singleton(options);
}
