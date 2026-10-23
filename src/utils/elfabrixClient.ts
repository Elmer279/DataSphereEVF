/**
 * Client-Side Service for communicating with ElFabriX Orchestrator Agent
 * Bridges WebApp in-app chat, voice, telegram, messenger, and educational supervision workflows.
 */

export interface ElFabriXRequestOptions {
  channel?: 'webapp' | 'voice' | 'telegram_private' | 'telegram_group' | 'fb_messenger' | 'fb_page_post';
  role?: 'admin' | 'staff' | 'guest';
  contextData?: Record<string, any>;
}

export interface ElFabriXResponse {
  success: boolean;
  reply: string;
  auditTrailId?: string;
  channel?: string;
  role?: string;
  timestamp?: string;
  error?: string;
  executionLog?: Array<{
    systemOrAgent: string;
    actionExecuted: string;
    outputIdOrStatus: string;
  }>;
}

/**
 * Send a prompt or command to ElFabriX Orchestrator
 * Works seamlessly in development, staging, or production by defaulting to the relative '/api/chat' endpoint.
 */
export async function sendMessageToElFabriX(
  userPrompt: string,
  options: ElFabriXRequestOptions = {}
): Promise<string> {
  const {
    channel = 'webapp',
    role = 'admin',
    contextData
  } = options;

  // Use relative endpoint so it automatically routes to current host/port in container or Cloud Run
  const endpoint = '/api/chat';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: userPrompt,
        channel,
        role,
        contextData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data: ElFabriXResponse = await response.json();

    if (data.success && data.reply) {
      return data.reply;
    } else {
      console.error('Error from ElFabriX:', data.error);
      return data.reply || data.error || 'ElFabriX was unable to formulate a response.';
    }
  } catch (error: any) {
    console.error('Network Error in sendMessageToElFabriX:', error);
    // Graceful offline fallback summary
    return `[ElFabriX Orchestrator Offline Fallback]\n\nExecution error connecting to /api/chat: ${error.message || error}.\nPlease verify server connectivity.`;
  }
}
