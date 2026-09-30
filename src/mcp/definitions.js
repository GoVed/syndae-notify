/**
 * MCP tool catalog definitions for Local Notifications tool (2024-11-05 spec).
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'send_notification',
    description: 'Send a local push notification directly to the operator device or desktop without Google FCM or Apple APNs (supports local ntfy, Gotify, desktop alert, local webhooks).',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short title for the alert (e.g. "Action Required", "Task Completed", "Clarification Needed")'
        },
        message: {
          type: 'string',
          description: 'Full message body explaining what requires attention or what finished'
        },
        urgency: {
          type: 'string',
          enum: ['info', 'action_required', 'alert'],
          description: 'Urgency tier: "info" (informational), "action_required" (waiting on operator), "alert" (urgent)'
        },
        endpoint: {
          type: 'string',
          description: 'Optional local webhook URL override (e.g. "http://192.168.1.2:8080/my-topic")'
        }
      },
      required: ['title', 'message']
    }
  }
];

export default { TOOL_DEFINITIONS };
