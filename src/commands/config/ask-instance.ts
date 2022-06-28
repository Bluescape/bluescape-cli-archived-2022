import inquirer from 'inquirer';

export async function askInstanceDetails() {
  const prompt = [
    {
      name: 'name',
      type: 'input',
      message: 'Enter Instance name (us):',
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter instance name like us';
        }
      },
    },
    {
      name: 'configUrl',
      type: 'input',
      message: 'Enter config url (https://config.apps.us.bluescape.com/):',
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter config url';
        }
      },
    },
  ];
  return inquirer.prompt(prompt);
}
