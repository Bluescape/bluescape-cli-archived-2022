import inquirer from "inquirer";

export async function askBluescapeCredentials(email: string) {
  const emailPrompt = {
    name: "username",
    type: "input",
    message: "Enter your Bluescape username or e-mail address:",
    validate: function (value: string) {
      if (value.length) {
        return true;
      } else {
        return "Please enter your username or e-mail address.";
      }
    },
  };
  const passPrompt = {
    name: "password",
    type: "password",
    message: "Enter your password:",
    validate: function (value: string) {
      if (value.length) {
        return true;
      } else {
        return "Please enter your password.";
      }
    },
  };
  const result = {
    username: email,
    password: '',
  };
  let input;
  if (email) {
    input = await inquirer.prompt([passPrompt]);
  } else {
    input = await inquirer.prompt([emailPrompt, passPrompt]);
    result.username = input.username;
  }
  result.password = input.password;
  return result;
}
