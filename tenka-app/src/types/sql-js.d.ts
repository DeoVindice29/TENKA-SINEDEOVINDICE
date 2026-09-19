declare module "sql.js" {
  export type Database = {
    exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
    close: () => void;
  };

  export type SqlJsStatic = {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  };

  export type InitSqlJsConfig = {
    locateFile?: (file: string) => string;
  };

  export default function initSqlJs(
    config?: InitSqlJsConfig,
  ): Promise<SqlJsStatic>;
}
