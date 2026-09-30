import { Command } from 'commander';
import { startHttpServer } from './mcp/http.js';
import { LocalNotificationDispatcher } from './dispatcher.js';

const program = new Command();

program
  .name('styx-notify')
  .description('Styx Local Notifications MCP Tool')
  .version('1.0.0');

program
  .command('daemon')
  .description('Start the Local Notification MCP HTTP daemon')
  .action(() => {
    startHttpServer();
  });

program
  .command('send <message>')
  .description('Send a notification from CLI')
  .option('-t, --title <title>', 'Notification title', 'Styx Notification')
  .option('-u, --urgency <urgency>', 'Urgency (info|action_required|alert)', 'info')
  .option('-e, --endpoint <url>', 'ntfy or custom webhook endpoint')
  .action(async (message, opts) => {
    try {
      const dispatcher = new LocalNotificationDispatcher();
      const res = await dispatcher.send({
        title: opts.title,
        message,
        urgency: opts.urgency,
        endpoint: opts.endpoint,
      });
      console.log('Dispatched:', res);
    } catch (err) {
      console.error('Dispatch failed:', err.message);
      process.exit(1);
    }
  });

if (process.argv.length <= 2) {
  startHttpServer();
} else {
  program.parse(process.argv);
}

export * from './dispatcher.js';
export * from './mcp/server.js';
