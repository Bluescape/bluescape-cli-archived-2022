import inquirer from 'inquirer';
import { isId } from '../../utils/validators';

export async function askOrganizationId(): Promise<string> {
  const organizationPrompt = {
    name: 'organizationId',
    type: 'input',
    message: 'Enter the Organization Id:',
    validate: function (value: string) {
      if (value.length && isId(value)) {
        return true;
      } else {
        return 'Please enter valid organizationId.';
      }
    },
  };

  const input = await inquirer.prompt([organizationPrompt]);
  return input.organizationId;
}

export async function askMirgrationInformation(): Promise<string> {
  const actionPrompt = {
    name: 'action',
    type: 'list',
    message: 'Which action do you prefer to do now?',
    choices: ['Dry-run', 'Execute Migration'],
    validate: function (value: string) {
      if (value.length) {
        return true;
      } else {
        return 'Please select to proceed.';
      }
    },
  };
  

  const input = await inquirer.prompt([actionPrompt]);
  return input.action;
}
