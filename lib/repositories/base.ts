import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Base repository interface
 * All repositories should implement this interface for consistency
 */
export interface IRepository {
  /**
   * Check if the repository is available (e.g., Supabase is configured)
   */
  isAvailable(): boolean;
}

/**
 * Base repository result type
 */
export type RepositoryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Base repository class with common functionality
 */
export abstract class BaseRepository implements IRepository {
  protected isDemo: boolean;

  constructor(isDemo: boolean = false) {
    this.isDemo = isDemo;
  }

  isAvailable(): boolean {
    return !this.isDemo;
  }

  /**
   * Handle repository errors consistently
   */
  protected handleError(error: unknown): PostgrestError {
    if (error && typeof error === 'object' && 'message' in error) {
      return error as PostgrestError;
    }
    return {
      message: String(error),
      details: '',
      hint: '',
      code: '',
    } as PostgrestError;
  }
}
