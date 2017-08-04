'use strict';

import configuration from './configuration';
import inquirer from 'inquirer';
import { noop } from 'lodash';
import path from 'path';
import { exec, rm } from 'shelljs';

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: 'star-rating'
};

const widgetPath = 'widget';

inquirer.prompt([question]).then((answers) => {
  initialize(answers.name);
  console.log(`Creating widget...`);
  return asPromise({code: 0}, noop);
}).then(() => {
  console.log(`Cloning template repository...`);
  return cloneRepo(configuration.TEMPLATE_REPO_URL, widgetPath);
}).then(() => {
  rm('-rf', path.join(__dirname, '..', '..', '..', widgetPath, '.git'));
});

function asPromise(result, resolve, reject) {
  return result.code === 0 ? resolve() : reject(result.stderr);
}

function cloneRepo(repoUrl, repoPath) {
  return new Promise((resolve, reject) => {
    const result = exec(`git clone ${repoUrl} ${repoPath}`,
      {silent: configuration.IS_EXECUTION_SILENT});
    return asPromise(result, resolve, reject);
  });
}

function initialize(aName) {
  console.log(`Your name is ${aName}`);
}
