'use strict';

import inquirer from 'inquirer';
import { exec } from 'shelljs';

console.log('Hello world: edoras-one-addon-frontend-cli');

const question = {
  type: 'input',
  name: 'name',
  message: `What's the name of your widget?`,
  default: 'star-rating'
};

inquirer.prompt([question]).then(function(answers) {
  initialize(answers.name);

  const result = exec(`git clone https://github.com/edorasware/edoras-one-addon-frontend-template.git`);
  console.log(result);
});

function initialize(aName) {
  console.log(`Your name is ${aName}`);
}
