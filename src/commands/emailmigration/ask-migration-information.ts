import inquirer from 'inquirer';
import { isId } from '../../utils/validators';

export async function askOrganizationId(): Promise<string> {
  const organizationPrompt = {
    name: 'organizationId',
    type: 'input',
    message: 'Enter the Organization Id:',
    validate: function (value: string) {
      if (isId(value)) {
        return true;
      } else {
        return 'Please enter valid organizationId.';
      }
    },
  };

  const input = await inquirer.prompt([organizationPrompt]);
  return input.organizationId;
}
