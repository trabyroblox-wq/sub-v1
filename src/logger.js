import chalk from 'chalk';

const prefix = chalk.bgBlue.black(' SUB v1 ');

export const logger = {
  info:    (msg) => console.log(prefix, chalk.cyan('[info]'), msg),
  ready:   (msg) => console.log(prefix, chalk.green('[ready]'), msg),
  request: (msg) => console.log(prefix, chalk.yellow('[→]'), msg),
  connect: (msg) => console.log(prefix, chalk.magenta('[CONNECT]'), msg),
  error:   (msg) => console.error(prefix, chalk.red('[ERROR]'), msg),
};
