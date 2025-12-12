import { CLI } from './cli';
import chalk from 'chalk';

async function main() {
  try {
    const cli = new CLI();
    await cli.execute();
  } catch (error) {
    console.error(chalk.red('Main Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();