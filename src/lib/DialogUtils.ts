const remote = require('@electron/remote');

window.confirm = function (message) {
  const buttonIdx = remote.dialog.showMessageBoxSync(null, {
    type: 'question',
    buttons: ['OK', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    detail: message,
    message: ''
  });
  return buttonIdx === 0;
};