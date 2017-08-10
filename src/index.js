'use strict';

import configuration from './configuration';
import inquirer from 'inquirer';
import { noop } from 'lodash';
import { showErrorMessageAndQuit, showMessage, showStartScreen } from './messages';
import path from 'path';
import { cd, exec, rm } from 'shelljs';

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: 'star-rating'
};

const widgetPath = 'widget';

let widgetName;

showStartScreen();

inquirer.prompt([question]).then((answers) => {
  initialize(answers.name);
  showMessage(`Creating widget...`);
  return asPromise({code: 0}, noop);
}).then(() => {
  showMessage(`Cloning template repository...`);
  return cloneRepo(configuration.TEMPLATE_REPO_URL, widgetPath);
}).then(() => {
  showMessage(`Create dist files...`);
  return createDist();
}).then(() => {
  showMessage([
    ``,
    `New project with name '${widgetName}' has been created with a widget boilerplate.`,
    `Please have a look at the README file for instructions.`,
    ``
  ]);
})
.catch((error) => {
  showErrorMessageAndQuit(error);
});

function asPromise(result, resolve, reject) {
  return result.code === 0 ? resolve() : reject(result.stderr);
}

function cloneRepo(repoUrl, repoPath) {
  return new Promise((resolve, reject) => {
    let result = exec(`git clone ${repoUrl} ${repoPath}`,
      {silent: configuration.IS_EXECUTION_SILENT});

    // remove meta data in .git folder
    result = rm('-rf', path.join(__dirname, '..', '..', '..', repoPath, '.git'));

    return asPromise(result, resolve, reject);
  });
}

function createDist() {
  return new Promise((resolve, reject) => {
    cd(path.join(__dirname, '..', '..', '..', widgetPath));
    exec(`npm install`,
      {silent: configuration.IS_EXECUTION_SILENT});
    const result = exec(`npm run build`,
      {silent: configuration.IS_EXECUTION_SILENT});
    return asPromise(result, resolve, reject);
  });
}

function initialize(aName) {
  showMessage(`Your name is ${aName}`);
  widgetName = aName;
}
