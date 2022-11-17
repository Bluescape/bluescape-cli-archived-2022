import inquirer from 'inquirer';
import { isExternalSubscriptionId } from '../../utils/validators';

export async function askLegacySubscriptionDetails(): Promise<any> {
  const legacySubscriptionInputPrompt = [
    {
      name: 'externalSubscriptionId',
      type: 'input',
      message: 'Enter the external subscription Id:',
      validate: function (value: string) {
        if (isExternalSubscriptionId(value)) {
          return true;
        } else {
          return 'Please enter valid external subscription Id';
        }
      },
    },
    {
      name: 'externalSubscriptionVersion',
      type: 'input',
      message: 'Enter the external subscription version:',
      validate: function (value: string) {
        if (Number.isInteger(value) || !value.length) {
          return true;
        } else {
          return 'Please enter valid external subscription version';
        }
      },
    },
    {
      name: 'licenseQuantity',
      type: 'input',
      message: 'Enter the license quantity:',
      validate: function (value: string) {
        if (Number.isInteger(value) || !value.length) {
          return true;
        } else {
          return 'Please enter valid license quantity';
        }
      },
    },
    {
      name: 'currency',
      type: 'list',
      choices: ['USD'],
      message: 'Enter currency:',
      default: 'USD',
    },
    {
      name: 'interval',
      type: 'list',
      choices: ['Yearly', 'Monthly'],
      message: 'Enter interval:',
      default: 'Yearly',
    },
    {
      name: 'organizationStorageLimitMb',
      type: 'input',
      message: 'Enter organization storage limit Mb:',
      validate: function (value: string) {
        if (Number.isInteger(value) || !value.length) {
          return true;
        } else {
          return 'Please enter valid organization storage limit Mb';
        }
      },
    },
  ];

  return inquirer.prompt(legacySubscriptionInputPrompt);
}
