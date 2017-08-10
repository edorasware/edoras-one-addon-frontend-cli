'use strict';

import { camelCase, paramCase, titleCase } from 'change-case';
import configuration from './configuration';
import inquirer from 'inquirer';
import { noop } from 'lodash';
import { showErrorMessageAndQuit, showMessage, showStartScreen } from './messages';
import path from 'path';
import replace from 'replace';
import { cd, exec, rm } from 'shelljs';

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: 'star-rating'
};

const WIDGET_PATH = 'widget';
const EDORAS_ONE_WIDGET_NAME_PREFIX = 'edoras';
const EDORAS_ONE_WIDGET_NAME = 'addon';

let widgetName;
let widgetNameFull;

showStartScreen();

inquirer.prompt([question]).then((answers) => {
  initialize(answers.name);
  showMessage(`Creating widget...`);
  return asPromise({code: 0}, noop);
}).then(() => {
  showMessage(`Cloning template repository...`);
  return cloneRepo(configuration.TEMPLATE_REPO_URL, WIDGET_PATH);
}).then(() => {
  showMessage(`Renaming files in cloned template...`);
  return renameFiles();
}).then(() => {
  showMessage(`Replacing names in cloned template...`);
  return replaceNames();
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
    cd(path.join(__dirname, '..', '..', '..', WIDGET_PATH));
    exec(`npm install`,
      {silent: configuration.IS_EXECUTION_SILENT});
    const result = exec(`npm run build`,
      {silent: configuration.IS_EXECUTION_SILENT});
    return asPromise(result, resolve, reject);
  });
}

function executeInPath(command, path) {
  return new Promise((resolve, reject) => {
    cd(path);
    const result = exec(command, {silent: configuration.IS_EXECUTION_SILENT});

    return asPromise(result, resolve, reject);
  });
}

function initialize(aName) {
  showMessage(`Your name is ${aName}`);
  widgetName = aName.replace(/-/g, ' ').toLowerCase();
  widgetNameFull = `${EDORAS_ONE_WIDGET_NAME_PREFIX}-${EDORAS_ONE_WIDGET_NAME}-${paramCase(widgetName)}`;
}

function renameFile(path, source, target) {
  return new Promise((resolve) => {
    const command = `mv ${source} ${target}`;
    executeInPath(command, path);
    resolve();
  });
}

function renameFiles() {
  return renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'), 'widget.module.js', widgetNameFull + '.module.js');
}

function replaceInPath(path, searchRegex, replacement) {
  return new Promise((resolve) => {
    replace({
      regex: `{{${searchRegex}}}`,
      replacement: replacement,
      paths: [path],
      recursive: true,
      silent: true
    });

    resolve();
  });
}

function replaceNames() {
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH), 'widgetNameCamelCase', camelCase(widgetNameFull), ['**/*.js']);
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH), 'widgetNameParamCase', widgetNameFull, ['**/*.js'], ['**/*.scss'], ['package.json']);
  return replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH), 'widgetNameTitleCase', titleCase(widgetName), ['README.md']);
}
