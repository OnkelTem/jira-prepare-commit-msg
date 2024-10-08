#!/usr/bin/env node

import * as git from './git';
import { loadConfig } from './config';
import { debug, error } from './log';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
  debug('start');

  try {
    const config = await loadConfig();
    const gitRoot = git.getRoot(config.gitRoot);
    const branch = git.getBranchName(gitRoot);

    if (!branch) {
      debug('Cannot determine branch name, skipping.');
      return
    }

    const ignored = new RegExp(config.ignoredBranchesPattern || '^$', 'i');

    if (ignored.test(branch)) {
      debug('The branch is ignored by the configuration rule');
      return;
    }

    const ticket = git.getJiraTicket(branch, config);

    if (ticket === null) {
      if (config.ignoreBranchesMissingTickets) {
        debug('The branch does not contain a JIRA ticket and is ignored by the configuration rule');
      } else {
        error('The JIRA ticket ID not found');
      }

      return;
    }

    debug(`The JIRA ticket ID is: ${ticket}`);

    git.writeJiraTicket(ticket, config);
  } catch (err: unknown) {
    if (typeof err === 'string') {
      error(err);
    } else {
      error(String(err));
    }
  }

  debug('done');
})();
