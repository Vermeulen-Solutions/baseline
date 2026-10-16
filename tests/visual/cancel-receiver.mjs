// Windows child.kill('SIGINT') terminates immediately, bypassing global teardown.
// Relay wrapper cancellation as an in-process signal so Playwright can clean up.
// Node preloads are inherited by Playwright workers. Never alter their IPC channel.
const runner = process.argv[1]?.replaceAll('\\', '/').endsWith('/@playwright/test/cli.js') || process.argv[1] === '--visual-cancel-probe';
if (runner && process.send) {
  process.on('message', message => {
    if (message?.type !== 'visual-cancel' || !['SIGINT', 'SIGTERM'].includes(message.signal)) return;
    if (!process.emit(message.signal)) process.exit(message.signal === 'SIGINT' ? 130 : 143);
  });
  process.channel?.unref();
}
