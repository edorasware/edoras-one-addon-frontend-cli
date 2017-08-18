'use strict';

import { quitWithErrorMessage } from './assertions';

export function showStartScreen() {
  console.log();
  console.log(`           _                                                `);
  console.log(`          | |                                               `);
  console.log(`   ___  __| | ___  _ __ __ _ ___    ___  _ __   ___         `);
  console.log(`  / _ \\/ _\` |/ _ \\| '__/ _\` / __|  / _ \\| '_ \\ / _ \\ `);
  console.log(` |  __/ (_| | (_) | | | (_| \\__ \\ | (_) | | | |  __/      `);
  console.log(`  \\___|\\__,_|\\___/|_|  \\__,_|___/  \\___/|_| |_|\\___|  `);
  console.log();
  console.log(`   ===== edoras one Front-end CLI =====`);
  console.log();
  console.log();
}

export function showMessage(message) {
  const callback = value => {
    const lines = typeof message === 'string' ? [message] : message;

    lines.forEach(line => console.log(line));

    return value;
  };

  return Promise.resolve(callback());
}

export function showErrorMessageAndQuit(errorMessage) {
  quitWithErrorMessage(errorMessage);
}
