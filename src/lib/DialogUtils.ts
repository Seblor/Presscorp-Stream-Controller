declare global {
  interface Window {
    electronRemote: {
      dialog: {
        showMessageBoxSync: (options: {
          type?: string;
          buttons?: string[];
          defaultId?: number;
          cancelId?: number;
          detail?: string;
          message?: string;
        }) => Promise<number>;
      };
    };
  }
}

// Store original confirm
const originalConfirm = window.confirm;

// Override with async version that uses Electron dialog
if (window.electronRemote) {
  // @ts-expect-error - we need to override confirm with async version
  window.confirm = async (message) => {
    const buttonIdx = await window.electronRemote.dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['OK', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      detail: message,
      message: ''
    });
    return buttonIdx === 0;
  };
} else {
  // Fallback to original confirm if Electron isn't available
  window.confirm = originalConfirm;
}

// Export to make this a module
export {};