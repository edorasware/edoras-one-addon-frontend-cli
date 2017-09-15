'use strict';

import { camelCase, paramCase, pascalCase, titleCase } from 'change-case';
import configuration from './configuration';
import inquirer from 'inquirer';
import { showErrorMessageAndQuit, showMessage, showStartScreen } from './messages';
import path from 'path';
import replace from 'replace';
import { cd, exec, mkdir, mv, rm } from 'shelljs';


const EDORAS_ONE_WIDGET_NAME = 'addon';
const EDORAS_ONE_WIDGET_NAME_PREFIX = 'edoras';
const WIDGET_PATH = 'widget';

const questionAddonName = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: predictWidgetName()
};

const questionLogLevel = {
  type: 'list',
  name: 'logLevel',
  message: `Which log level do you prefer?`,
  choices: [
    'info',
    'verbose'
  ]
};

let isExecutionSilent;
let widgetName;
let widgetNameFull;
let widgetNameOriginal;

showStartScreen();

inquirer.prompt([questionAddonName]).then((answers) => {
  initialize(answers.name);
  return asPromise({code: 0}, () => {});
}).then(() => {
  return setLogLevel();
}).then(() => {
  showMessage(`Creating widget...`);
  return cleanup();
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
  showMessage(`Moving files...`);
  return moveFiles();
}).then(() => {
  showMessage(`Creating build files...`);
  return createBuild();
}).then(() => {
  showMessage([
    ``,
    `New project with name '${titleCase(widgetName)}' has been created from frontend template.`,
    `Please have a look at the README file for instructions.`,
    ``
  ]);
})
.catch((error) => {
  showErrorMessageAndQuit(error);
});

/**
 * Resolve or reject based on result code
 * asPromise :: (object, function, function) -> Promise
 */
function asPromise(result, resolve, reject) {
  return result.code === 0 ? resolve() : reject(result.stderr);
}

/**
 * Remove widget and palette files
 * cleanup :: undefined -> Promise
 */
function cleanup() {
  return new Promise((resolve, reject) => {
    rm('-rf',
      path.join(__dirname, '..', '..', '..', WIDGET_PATH));
    const result = rm('-rf',
      path.join(__dirname, '..', '..', '..', '..', widgetNameFull, 'src', 'main', 'resources', 'com', 'edorasware', 'one', 'widgets'));
    return asPromise(result, resolve, reject);
  });
}

/**
 * Clone a git repo to a specified path
 * cloneRepo :: (string, string) -> Promise
 */
function cloneRepo(repoUrl, repoPath) {
  return new Promise((resolve, reject) => {
    let result = exec(`git clone ${repoUrl} ${repoPath}`,
      {silent: isExecutionSilent});

    // remove meta data in .git folder
    result = rm('-rf',
      path.join(__dirname, '..', '..', '..', repoPath, '.git'));

    return asPromise(result, resolve, reject);
  });
}

/**
 * Create build files with webpack
 * createBuild :: undefined -> Promise
 */
function createBuild() {
  return new Promise((resolve, reject) => {
    cd(path.join(__dirname, '..', '..', '..', WIDGET_PATH));
    exec(`npm install`,
      {silent: isExecutionSilent});
    const result = exec(`npm run dist`,
      {silent: isExecutionSilent});
    return asPromise(result, resolve, reject);
  });
}

/**
 * Execute a command in a specific path
 * executeInPath :: (string, path) -> Promise
 */
function executeInPath(command, path) {
  return new Promise((resolve, reject) => {
    cd(path);
    const result = exec(command, {silent: isExecutionSilent});

    return asPromise(result, resolve, reject);
  });
}

/**
 * Initialize cli by setting name variables
 * initialize :: string -> undefined
 */
function initialize(aName) {
  showMessage(`Your widget name is ${aName}.`);
  widgetName = aName.replace(/-/g, ' ').toLowerCase();
  widgetNameFull =
    `${EDORAS_ONE_WIDGET_NAME_PREFIX}-${EDORAS_ONE_WIDGET_NAME}-${paramCase(widgetName)}`;
}

/**
 * Move palette files to addon folder
 * moveFiles :: undefined -> Promise
 */
function moveFiles() {
  return new Promise((resolve, reject) => {
    const source =
      path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette');
    const dest =
      path.join(__dirname, '..', '..', '..', '..', widgetNameOriginal, 'src', 'main', 'resources', 'com', 'edorasware', 'one', 'widgets');
    mkdir('-p', dest);

    const result = mv('-f', source, dest);
    return asPromise(result, resolve, reject);
  });
}

/**
 * Predict the widget name in param case from the parent directory
 * predictWidgetName :: undefined -> string
 */
function predictWidgetName() {
  try {
    let rootName;
    let currentPathParts = path.dirname(__dirname).split(path.sep);

    // go three levels up in path
    for (let i = 0; i < 3; i++) {
      rootName = currentPathParts.pop();
    }

    widgetNameOriginal = rootName.replace('-frontend', '');

    // extract widget name
    const regExp = new RegExp('edoras-addon-(.*)-frontend');
    const widgetName = rootName.match(regExp)[1];
    if (widgetName) {
      return paramCase(widgetName);
    } else {
      throw 'Invalid name';
    }
  } catch (err) {
    // return default value
    return 'star-rating';
  }
}

/**
 * Rename file in path
 * renameFile :: (path, string, target) -> string
 */
function renameFile(path, source, target) {
  return new Promise((resolve) => {
    const command = `mv ${source} ${target}`;
    executeInPath(command, path);
    resolve();
  });
}

/**
 * Rename multiple files
 * renameFile :: undefined -> Promise
 */
function renameFiles() {
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette'),
    'widget.form.palette.xml', `${widgetNameFull}.form.palette.xml`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette', 'i18n'),
    'widget.translation.properties', `${widgetNameFull}.translation.properties`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette', 'icon'),
    'widget.icon.png', `${widgetNameFull}.icon.png`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.component.js', `${paramCase(widgetName)}.component.js`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.configuration.js', `${paramCase(widgetName)}.configuration.js`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.controller.js', `${paramCase(widgetName)}.controller.js`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.module.js', `${paramCase(widgetName)}.module.js`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.service.js', `${paramCase(widgetName)}.service.js`);
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.tpl.html', `${paramCase(widgetName)}.tpl.html`);
  return renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src', 'adapters'),
    'widget.adapter.js', `${paramCase(widgetName)}.adapter.js`);
}

/**
 * Replace string with pattern in file
 * replaceInPath :: (path, string, string) -> Promise
 */
function replaceInPath(path, searchRegex, replacement) {
  return new Promise((resolve) => {
    replace({
      regex: `{{${searchRegex}}}`,
      replacement: replacement,
      paths: [path],
      recursive: true,
      silent: isExecutionSilent
    });

    resolve();
  });
}

/**
 * Replace template strings with widget name in multiple files
 * replaceNames :: undefined -> Promise
 */
function replaceNames() {
  const filePatterns = [
    '**/*.html',
    '**/*.js',
    '**/*.json',
    '**/*.md',
    '**/*.properties',
    '**/*.scss',
    '**/*.xml'
  ];

  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameFullCamelCase', camelCase(widgetNameFull), filePatterns);
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameFullParamCase', widgetNameFull, filePatterns);
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameFullPascalCase', pascalCase(widgetNameFull), filePatterns);
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameParamCase', paramCase(widgetName), filePatterns);
  return replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameTitleCase', titleCase(widgetName), filePatterns);
}

/**
 * Ask for log level and store it
 * setLogLevel :: undefined -> Promise
 */
function setLogLevel() {
  return inquirer.prompt([questionLogLevel]).then((answers) => {
    showMessage(`Set log level to ${answers.logLevel}.`);
    isExecutionSilent = answers.logLevel === 'info' ? true : false;
    return asPromise({code: 0}, () => {});
  });
}
