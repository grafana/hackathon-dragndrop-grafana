import { ClipboardEvent, DragEvent, useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { useAppNotification } from 'app/core/copy/appNotification';
import { usePluginHooks } from 'app/features/plugins/extensions/usePluginHooks';

const SUPPORTED_FILE_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'application/json',
  'image/png',
  'image/jpeg',
];

export function useDropAndPaste() {
  const notify = useAppNotification();
  const [fileType, setFileType] = useState<string | undefined>();

  const { hooks } = usePluginHooks<(data: File) => null>({
    extensionPointId: 'dashboard/grid',
    limitPerPlugin: 200,
  });

  const onImportFile = useCallback(
    (file?: File) => {
      // No file means the user dropped something that wasn't accepted
      if (!file) {
        return;
      }

      for (const hook of hooks) {
        hook(file);
      }

      notify.success(`Importing file: ${file.name}`);
    },
    [hooks, notify]
  );

  // ClipboardItem may have multiple MIME types, but we only currently care about the first one
  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const clipboardData = event.clipboardData;

      if (clipboardData.files.length > 0) {
        // Handle file paste
        onImportFile(clipboardData.files[0]);
        return;
      }

      if (clipboardData.types.includes('text/plain')) {
        // Handle plaintext paste
        const text = clipboardData.getData('text/plain');
        notify.success(`Pasted text: \n${text}`);

        return;
      }

      if (clipboardData.types.includes('text/html')) {
        // Handle HTML paste
        const html = clipboardData.getData('text/html');
        notify.success(`Pasted HTML:\n${html}`);

        return;
      }

      if (clipboardData.types.includes('image/png')) {
        // Handle image paste
        // const image = clipboardData.items[0].getAsFile();
        notify.success('Pasted image - no preview available yet');

        return;
      }

      notify.success('Pasted data of unknown type');
    },
    [notify, onImportFile]
  );

  const onDragEnter = useCallback((event: DragEvent) => {
    const file = event.dataTransfer?.items[0].type;
    setFileType(file);
  }, []);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop: ([acceptedFile]) => onImportFile(acceptedFile),
    onDragEnter,
    onDragLeave: () => setFileType(undefined),
    onError: () => notify.error('Error importing file'),
    validator: (file) => {
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        return [{ message: 'Unsupported file type', code: 'unsupported_file_type' }];
      }

      return null;
    },
  });

  useEffect(() => {
    !isDragActive && setFileType(undefined);
  }, [isDragActive]);

  return {
    hint: fileType ? getHint(fileType) : undefined,
    getRootProps,
    isDragActive,
    onPaste,
  };
}

function getHint(fileType: string) {
  switch (fileType) {
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'text/csv':
      return 'Create table from spreadsheet';
    case 'application/json':
      return 'Create table from JSON';
    case 'image/png':
    case 'image/jpeg':
      return 'Create image panel';
    case 'text/plain':
      return 'Create text panel';
    default:
      return 'Unsupported file type';
  }
}
