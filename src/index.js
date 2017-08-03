'use strict';

import configuration from './configuration';
import inquirer from 'inquirer';
import { exec } from 'shelljs';

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: 'star-rating'
};

inquirer.prompt([question]).then(function(answers) {
  initialize(answers.name);

  exec(`git clone ${configuration.TEMPLATE_REPO_URL} widget`);
});

function initialize(aName) {
  console.log(`Your name is ${aName}`);
}
