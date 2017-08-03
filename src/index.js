'use strict';

import configuration from './configuration';
import inquirer from 'inquirer';
import path from 'path';
import { exec, rm } from 'shelljs';

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: 'star-rating'
};

const widgetPath = 'widget';

inquirer.prompt([question]).then(function(answers) {
  initialize(answers.name);

  exec(`git clone ${configuration.TEMPLATE_REPO_URL} ${widgetPath}`);
  rm('-rf', path.join(__dirname, '..', '..', '..', widgetPath, '.git'));
});

function initialize(aName) {
  console.log(`Your name is ${aName}`);
}
