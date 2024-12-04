import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Modal, useStyles2 } from '@grafana/ui';

import { DashboardScene } from '../scene/DashboardScene';

import { useDropAndPaste } from './useDropAndPaste';

interface Props {
  children: React.ReactNode;
  dashboard: DashboardScene;
}

export function DashboardDropTarget({ children, dashboard }: Props) {
  const { data, hint, getRootProps, isDragActive, onClose, onPaste } = useDropAndPaste(dashboard);
  const styles = useStyles2(getStyles, isDragActive);

  return (
    <div {...getRootProps({ className: styles.body })} onPaste={onPaste}>
      {children}
      <div className={styles.dropOverlay}>
        <div className={styles.dropHint}>
          <Icon name="upload" size="xxxl"></Icon>
          <h3>{hint}</h3>
        </div>
      </div>
      <Modal title="Suggestions" isOpen={!!data} onDismiss={onClose}>
        <p>You've added a {data?.type}</p>
        <Modal.ButtonRow>
          <Button onClick={onClose}>Close</Button>
        </Modal.ButtonRow>
      </Modal>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2, isDragActive: boolean) {
  return {
    body: css({
      label: 'body',
      display: 'flex',
      flexGrow: 1,
      gap: '8px',
      boxSizing: 'border-box',
      flexDirection: 'column',
      padding: theme.spacing(0, 2, 2, 2),
    }),
    dropZone: css({ height: '100%' }),
    dropOverlay: css({
      backgroundColor: isDragActive ? theme.colors.action.hover : 'inherit',
      border: isDragActive ? `2px dashed ${theme.colors.border.medium}` : 0,
      position: 'absolute',
      display: isDragActive ? 'flex' : 'none',
      zIndex: theme.zIndex.modal,
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    dropHint: css({
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
    }),
  };
}
