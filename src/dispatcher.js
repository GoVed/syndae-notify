import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LocalNotificationDispatcher {
  constructor(config = {}) {
    this.ntfyUrl = config.ntfyUrl || process.env.NTFY_URL || null;
    this.gotifyUrl = config.gotifyUrl || process.env.GOTIFY_URL || null;
    this.gotifyToken = config.gotifyToken || process.env.GOTIFY_TOKEN || null;
    this.syndaeUrl = config.syndaeUrl || process.env.SYNDAE_URL || 'http://localhost:3000';
    this.syndaeAccessKey = config.syndaeAccessKey || process.env.SYNDAE_ACCESS_KEY || 'syndae-local-dev-key';
  }

  async send(params) {
    const {
      title = 'Syndae Notification',
      message = '',
      urgency = 'info',
      endpoint = null,
    } = params;

    const results = {
      success: true,
      delivered_to: [],
      errors: [],
    };

    const targetUrl = endpoint || this.ntfyUrl;

    // 1. Dispatch to local ntfy server if configured or specified
    if (targetUrl) {
      try {
        const priorityMap = {
          info: '3',
          action_required: '4',
          alert: '5',
        };
        const priority = priorityMap[urgency] || '3';

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Title': title,
            'Priority': priority,
            'Tags': urgency === 'alert' ? 'warning' : 'robot',
          },
          body: message,
        });

        if (res.ok) {
          results.delivered_to.push(`ntfy (${targetUrl})`);
        } else {
          results.errors.push(`ntfy returned status ${res.status}`);
        }
      } catch (err) {
        results.errors.push(`ntfy dispatch failed: ${err.message}`);
      }
    }

    // 2. Dispatch to local Gotify if configured
    if (this.gotifyUrl && this.gotifyToken) {
      try {
        const url = `${this.gotifyUrl.replace(/\/$/, '')}/message?token=${this.gotifyToken}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            priority: urgency === 'alert' ? 8 : urgency === 'action_required' ? 6 : 4,
          }),
        });
        if (res.ok) {
          results.delivered_to.push('gotify');
        } else {
          results.errors.push(`gotify returned ${res.status}`);
        }
      } catch (err) {
        results.errors.push(`gotify dispatch failed: ${err.message}`);
      }
    }

    // 3. Local Desktop OS notification (Linux notify-send)
    try {
      const urgencyFlag = urgency === 'alert' ? 'critical' : urgency === 'action_required' ? 'normal' : 'low';
      const cleanTitle = title.replace(/"/g, '\\"');
      const cleanMessage = message.replace(/"/g, '\\"');
      await execAsync(`notify-send -u ${urgencyFlag} "${cleanTitle}" "${cleanMessage}"`, { timeout: 2000 });
      results.delivered_to.push('desktop_notification');
    } catch {
      // Ignore if notify-send is not installed or running headlessly in container
    }

    // 4. Syndae inbound webhook relay (if Syndae is running)
    if (this.syndaeUrl) {
      try {
        const triggerUrl = `${this.syndaeUrl.replace(/\/$/, '')}/api/tools/trigger`;
        const res = await fetch(triggerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.syndaeAccessKey}`,
          },
          body: JSON.stringify({
            protocol: 'notify',
            channel_id: 'operator-alerts',
            source_id: 'notify-tool',
            event_type: 'operator_notification',
            payload: {
              title,
              message,
              urgency,
              timestamp: new Date().toISOString(),
            },
          }),
        });
        if (res.ok) {
          results.delivered_to.push('syndae_inbound_stream');
        }
      } catch {
        // Syndae relay is optional
      }
    }

    // If nothing was reached and no errors recorded
    if (results.delivered_to.length === 0 && results.errors.length === 0) {
      results.delivered_to.push('logged_to_daemon');
    }

    return results;
  }
}
