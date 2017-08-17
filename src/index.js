'use strict';

import { camelCase, paramCase, pascalCase, titleCase } from 'change-case';
import configuration from './configuration';
import inquirer from 'inquirer';
import { noop } from 'lodash';
import { showErrorMessageAndQuit, showMessage, showStartScreen } from './messages';
import path from 'path';
import replace from 'replace';
import { cd, exec, mkdir, rm } from 'shelljs';

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: predictWidgetName()
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
  showMessage(`Moving files...`);
  return moveFiles();
}).then(() => {
  showMessage(`Creating dist files...`);
  return createDist();
}).then(() => {
  showMessage([
    ``,
    `New project with name '${titleCase(widgetName)}' has been created with a widget boilerplate.`,
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
    result = rm('-rf',
      path.join(__dirname, '..', '..', '..', repoPath, '.git'));

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
  showMessage(`Your widget name is ${aName}`);
  widgetName = aName.replace(/-/g, ' ').toLowerCase();
  widgetNameFull =
    `${EDORAS_ONE_WIDGET_NAME_PREFIX}-${EDORAS_ONE_WIDGET_NAME}-${paramCase(widgetName)}`;
}

function moveFiles() {
  return new Promise((resolve, reject) => {
    const source =
      path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette');
    const dest =
      path.join(__dirname, '..', '..', '..', '..', widgetNameFull, 'src', 'main', 'resources', 'com', 'edorasware', 'one', 'widgets');
    mkdir('-p', dest);

    const result = exec(`mv ${source} ${dest}`);

    return asPromise(result, resolve, reject);
  });
}

function predictWidgetName() {
  try {
    let rootName;
    let currentPathParts = path.dirname(__dirname).split(path.sep);

    for (var i = 0; i < 3; i++ ) {
      rootName = currentPathParts.pop();
    }

    const regExp = new RegExp('edoras-addon-' + '(.*)' + '-frontend');
    const widgetName = rootName.match(regExp)[1];
    if (widgetName) {
      return widgetName;
    } else {
      throw 'Invalid name';
    }
  } catch(err) {
    return 'star-rating';
  }
}

function renameFile(path, source, target) {
  return new Promise((resolve) => {
    const command = `mv ${source} ${target}`;
    executeInPath(command, path);
    resolve();
  });
}

function renameFiles() {
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette'),
    'widget.form.palette.xml', widgetNameFull + '.form.palette.xml');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette', 'i18n'),
    'widget.translation.properties', widgetNameFull + '.translation.properties');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'palette', 'icon'),
    'widget.icon.png', widgetNameFull + '.icon.png');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.component.js', widgetNameFull + '.component.js');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.controller.js', widgetNameFull + '.controller.js');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.module.js', widgetNameFull + '.module.js');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.service.js', widgetNameFull + '.service.js');
  renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src'),
    'widget.tpl.html', widgetNameFull + '.tpl.html');
  return renameFile(path.join(__dirname, '..', '..', '..', WIDGET_PATH, 'src', 'adapters'),
    'widget.edorasone.adapter.js', widgetNameFull + '.edorasone.adapter.js');
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
    'widgetNameCamelCase', camelCase(widgetNameFull), filePatterns);
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameParamCase', widgetNameFull, filePatterns);
  replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNamePascalCase', pascalCase(widgetNameFull), filePatterns);
  return replaceInPath(path.join(__dirname, '..', '..', '..', WIDGET_PATH),
    'widgetNameTitleCase', titleCase(widgetName), filePatterns);
}
