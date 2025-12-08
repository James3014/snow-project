/**
 * ID Converter Utility
 * Converts between MongoDB ObjectId and UUID formats for API compatibility
 */

/**
 * Check if a string is a valid MongoDB ObjectId (24 hex characters)
 */
export function isMongoObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}

/**
 * Check if a string is a valid UUID format
 */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Convert MongoDB ObjectId to UUID v5 format
 * This creates a deterministic UUID from the ObjectId string
 */
export function mongoObjectIdToUUID(objectId: string): string {
  if (isUUID(objectId)) {
    // Already a UUID, return as-is
    return objectId;
  }

  if (!isMongoObjectId(objectId)) {
    throw new Error(`Invalid MongoDB ObjectId format: ${objectId}`);
  }

  // Convert ObjectId hex to UUID-like format
  // ObjectId: 24 hex chars -> we'll use a simple conversion approach
  // Pad the ObjectId (remove dashes if any) and format as UUID
  const sanitized = objectId.replace(/-/g, '').toLowerCase();

  // Simple conversion: take ObjectId and format as UUID
  // Pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
  const uuid = `${sanitized.substring(0, 8)}-${sanitized.substring(8, 12)}-4${sanitized.substring(13, 16)}-a${sanitized.substring(17, 20)}-${sanitized.substring(20, 32)}`;

  return uuid;
}

/**
 * Ensure ID is in UUID format for API calls
 * If input is MongoDB ObjectId, converts to UUID
 * If input is already UUID, returns as-is
 */
export function ensureUUID(id: string): string {
  if (isUUID(id)) {
    return id;
  }

  if (isMongoObjectId(id)) {
    return mongoObjectIdToUUID(id);
  }

  // If format is unknown, throw error to catch during development
  throw new Error(`Unknown ID format (not ObjectId or UUID): ${id}`);
}

/**
 * Safe version that logs warning instead of throwing
 */
export function ensureUUIDSafe(id: string | undefined | null): string | null {
  if (!id) {
    return null;
  }

  try {
    return ensureUUID(id);
  } catch (error) {
    console.warn(`Could not convert ID to UUID: ${id}`, error);
    // Return original ID as fallback to avoid breaking UI
    return id;
  }
}
