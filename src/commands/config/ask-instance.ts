import inquirer from "inquirer";

export async function askInstanceDetails() {
  const prompt = [
    {
      name: "name",
      type: "input",
      message: "Enter Instance name (uat, stg1):",
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter instance name like uat, stg1.";
        }
      },
    },
    {
      name: "configUrl",
      type: "input",
      message: "Enter config url:",
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter config url";
        }
      },
    },
  ];
  return inquirer.prompt(prompt);
}
