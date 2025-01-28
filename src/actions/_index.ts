#!/usr/bin/env node

import init from './init';
import sync from './sync';

async function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      await init();
      await sync();
      break;
    case 'sync':
      await sync();
      break;
    // TODO: implement 'watch'
    default:
      console.log(`Unknown subcommand: ${subcommand}`);
      console.log(`Usage: zeyon [init|sync]`); // `Usage: zeyon [init|sync|watch]`
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
