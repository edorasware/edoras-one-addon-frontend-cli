'use strict';

export function quitWithErrorMessage(message) {
  console.error();
  console.error(`Error: ${message}`);
  console.error();
  process.exit(1);
}
