/**
 * Safe JSON parser for responses that helps prevent the notorious "Unexpected token '<'..." HTML-parsing-as-JSON crash.
 * If the response is not valid JSON (e.g., HTML from a 404/500/unmatched route fallback), it extracts a clean error message.
 */
export async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  
  // Verify content type is JSON
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    const text = await response.text();
    if (text.trim().startsWith("<") || text.trim().startsWith("<!")) {
      throw new Error(`Expected JSON response, but received HTML (Status ${response.status}). This usually indicates an unmatched API endpoint or server error.`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Expected JSON response, but failed to parse payload: ${text.substring(0, 150)}...`);
    }
  }

  // Attempt standard parsing
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: true, empty: true };
    }
    return JSON.parse(text);
  } catch (parseErr: any) {
    throw new Error(`Failed to decode JSON body: ${parseErr.message}`);
  }
}

/**
 * A robust wrapper around fetch that validates response.ok and parses the JSON response safely.
 */
export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  const response = await fetch(input, init);
  if (!response.ok) {
    // If we have an error status, try to extract error details if any, but don't let HTML body crash the parse
    let errMsg = `HTTP Network Exception: status ${response.status}`;
    try {
      const errorData = await safeJsonParse(response);
      if (errorData && errorData.error) {
        errMsg = errorData.error;
      } else if (errorData && errorData.message) {
        errMsg = errorData.message;
      }
    } catch {
      // Ignore parse failure for error response, stick with default message
    }
    throw new Error(errMsg);
  }
  return safeJsonParse(response);
}
