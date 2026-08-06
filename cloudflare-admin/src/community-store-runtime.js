import { CommunityStore as BaseCommunityStore } from './community-store.js';

export class CommunityStore extends BaseCommunityStore {
  async changeUsername(body) {
    const originalSql = this.sql;
    const originalExec = originalSql.exec.bind(originalSql);

    this.sql = {
      exec(query, ...bindings) {
        const statement = String(query || '').trim().toUpperCase();
        if (statement === 'BEGIN IMMEDIATE' || statement === 'COMMIT' || statement === 'ROLLBACK') {
          return { toArray: () => [], one: () => null };
        }
        return originalExec(query, ...bindings);
      }
    };

    try {
      return await super.changeUsername(body);
    } finally {
      this.sql = originalSql;
    }
  }
}
