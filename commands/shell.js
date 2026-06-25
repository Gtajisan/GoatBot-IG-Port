const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
  config: { name: 'shell', aliases: ['sh', 'exec'], description: 'Execute shell commands (Developer only)', usage: 'shell <command>', cooldown: 5, role: 4, category: 'owner' },
  async run({ api, event, args, logger }) {
    const cmd = args.join(' ');
    if (!cmd) return api.sendMessage('❌ Usage: shell <command>', event.threadId);
    try {
      const { stdout, stderr } = await execPromise(cmd, { timeout: 30000, maxBuffer: 1024 * 1024 * 10 });
      let out = (stdout || '') + (stderr || '') || 'No output';
      if (out.length > 2000) out = out.substring(0, 1997) + '...';
      return api.sendMessage(`✓ Output:\n\n${out}`, event.threadId);
    } catch (e) {
      logger.error('shell error', { error: e.message });
      return api.sendMessage(`✗ Error:\n\n${e.message.substring(0, 1997)}`, event.threadId);
    }
  }
};
