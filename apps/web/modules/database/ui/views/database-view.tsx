"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { PluginCard, type Feature } from "@/modules/plugins/ui/components/plugin-card";
import { DatabaseIcon, CloudIcon, ServerIcon } from "lucide-react";

const dbFeatures: Feature[] = [
  {
    icon: DatabaseIcon,
    label: "PostgreSQL compatible",
    description: "Connect Neon, RDS, or any Postgres-like service",
  },
  {
    icon: CloudIcon,
    label: "Cloud providers",
    description: "Support for Neon, AWS RDS and other managed services",
  },
  {
    icon: ServerIcon,
    label: "Self-hosted",
    description: "Point to your own Postgres instance if needed",
  },
];

interface DatabaseFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface DatabaseRemoveFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DatabaseRemoveForm = ({ open, setOpen }: DatabaseRemoveFormProps) => {
  const removePlugin = useMutation(api.private.plugins.remove as any);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    try {
      await removePlugin({ service: "database" as any });
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect database</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to disconnect the database plugin for this organization?
        </DialogDescription>
        <DialogFooter>
          <Button
            disabled={isSubmitting}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleDisconnect}
            variant="destructive"
          >
            {isSubmitting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DatabaseForm = ({ open, setOpen }: DatabaseFormProps) => {
  // Cast to any until Convex codegen is regenerated with the new
  // 'database' service in the API types.
  const upsertSecret = useMutation(api.private.secrets.upsert as any);
  const [provider, setProvider] = useState<string>("neon");
  const [connectionString, setConnectionString] = useState<string>("");
  const [rdsResourceArn, setRdsResourceArn] = useState<string>("");
  const [rdsSecretArn, setRdsSecretArn] = useState<string>("");
  const [rdsDatabase, setRdsDatabase] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const isAwsRds = provider === "aws_rds";

    if (
      (!isAwsRds && !connectionString) ||
      (isAwsRds && (!rdsResourceArn || !rdsSecretArn || !rdsDatabase))
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      const value: any = {
        provider,
      };

      if (isAwsRds) {
        value.rdsResourceArn = rdsResourceArn;
        value.rdsSecretArn = rdsSecretArn;
        value.rdsDatabase = rdsDatabase;
      } else {
        value.connectionString = connectionString;
      }

      await upsertSecret({
        service: "database" as any,
        value,
      });
      setOpen(false);
      setConnectionString("");
      setRdsResourceArn("");
      setRdsSecretArn("");
      setRdsDatabase("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Database</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Configure a database connection for your agent. Credentials are stored
          securely using AWS Secrets Manager.
        </DialogDescription>
        <div className="flex flex-col gap-4 py-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neon">Neon (Postgres)</SelectItem>
                <SelectItem value="aws_rds">AWS RDS (Postgres)</SelectItem>
                <SelectItem value="other_postgres">Other Postgres</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {provider === "aws_rds" ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label>Aurora RDS resource ARN</Label>
                  <Input
                    value={rdsResourceArn}
                    onChange={(e) => setRdsResourceArn(e.target.value)}
                    placeholder="arn:aws:rds:region:account-id:cluster:cluster-name"
                    type="text"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <Label>RDS DB secret ARN</Label>
                  <Input
                    value={rdsSecretArn}
                    onChange={(e) => setRdsSecretArn(e.target.value)}
                    placeholder="arn:aws:secretsmanager:region:account-id:secret:db-credentials"
                    type="text"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Database name</Label>
                  <Input
                    value={rdsDatabase}
                    onChange={(e) => setRdsDatabase(e.target.value)}
                    placeholder="your_database_name"
                    type="text"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : (
              <>
                <Label>Connection string</Label>
                <Input
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="postgresql://user:password@host:port/db?sslmode=require"
                  type="password"
                  disabled={isSubmitting}
                />
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isSubmitting}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (provider === "aws_rds"
                ? !rdsResourceArn || !rdsSecretArn || !rdsDatabase
                : !connectionString)
            }
          >
            {isSubmitting ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const DatabaseView = () => {
  const dbPlugin = useQuery(api.private.plugins.getOne as any, {
    service: "database" as any,
  });
  const testConnection = useAction((api.private as any).database.test as any);
  const listTables = useAction(
    (api.private as any).database.listTables as any,
  );
  const previewTable = useAction(
    (api.private as any).database.previewTable as any,
  );
  const ingestFromDatabase = useAction(
    (api.private as any).database.ingest as any,
  );
  const [connectOpen, setConnectOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<
    | null
    | {
        success: boolean;
        message: string;
      }
  >(null);
  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [limitPerTable, setLimitPerTable] = useState<string>("100");
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<
    | null
    | {
        success: boolean;
        message: string;
      }
  >(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toggleConnection = () => {
    if (dbPlugin) {
      setRemoveOpen(true);
    } else {
      setConnectOpen(true);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const result: any = await testConnection({});
      setTestStatus({
        success: !!result?.success,
        message:
          result?.message ??
          (result?.success
            ? "Successfully connected to the configured database."
            : "Connection test failed."),
      });
    } catch (error) {
      console.error(error);
      setTestStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to test database connection.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLoadTables = async () => {
    setTablesLoading(true);
    setTablesError(null);
    try {
      const result: any = await listTables({});
      setTables(result?.tables ?? []);
      if (result?.tables && result.tables.length === 0) {
        setSelectedTable(null);
        setPreviewRows(null);
      }
    } catch (error) {
      console.error(error);
      setTables([]);
      setSelectedTable(null);
      setPreviewRows(null);
      setTablesError(
        error instanceof Error
          ? error.message
          : "Failed to load database tables.",
      );
    } finally {
      setTablesLoading(false);
    }
  };

  const handlePreviewTable = async (tableName: string) => {
    setSelectedTable(tableName);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result: any = await previewTable({ tableName, limit: 20 });
      setPreviewRows(result?.rows ?? []);
    } catch (error) {
      console.error(error);
      setPreviewRows([]);
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Failed to preview table.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    setIngestStatus(null);
    const parsed = Number(limitPerTable);
    const limit =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : undefined;
    try {
      const result: any = await ingestFromDatabase(
        limit ? { limitPerTable: limit } : {},
      );
      const success = !!result?.success;
      const stats = result?.stats as Record<string, number> | undefined;
      const tableCount = stats ? Object.keys(stats).length : 0;
      const totalRows = stats
        ? Object.values(stats).reduce(
            (sum, value) =>
              sum + (typeof value === "number" ? value : 0),
            0,
          )
        : 0;
      const message = success
        ? `Ingested ${totalRows} row(s) from ${tableCount} table(s) into RAG.`
        : result?.message ?? "Database ingestion failed.";
      setIngestStatus({ success, message });
    } catch (error) {
      console.error(error);
      setIngestStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to ingest database into RAG.",
      });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <>
      <DatabaseForm open={connectOpen} setOpen={setConnectOpen} />
      <DatabaseRemoveForm open={removeOpen} setOpen={setRemoveOpen} />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-screen-md">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Database</h1>
            <p className="text-muted-foreground">
              Configure a database connection for your AI assistant.
            </p>
          </div>
          <div className="mt-8">
            <PluginCard
              serviceImage="/logo.svg"
              serviceName={dbPlugin ? "Database (connected)" : "Database"}
              features={dbFeatures}
              isDisabled={false}
              actionLabel={dbPlugin ? "Disconnect" : "Connect"}
              onSubmit={toggleConnection}
            />
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleTest} disabled={testing}>
                {testing ? "Testing..." : "Test connection"}
              </Button>
              {testStatus && (
                <span
                  className={
                    testStatus.success
                      ? "text-sm text-green-600"
                      : "text-sm text-red-600"
                  }
                >
                  {testStatus.message}
                </span>
              )}
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Database inspection</h2>
                <p className="text-sm text-muted-foreground">
                  List public tables and preview sample rows from your configured
                  database.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadTables}
                    disabled={tablesLoading}
                  >
                    {tablesLoading ? "Loading tables..." : "Load tables"}
                  </Button>
                  {tablesError && (
                    <span className="text-xs text-red-600">
                      {tablesError}
                    </span>
                  )}
                </div>
                {tables.length > 0 && (
                  <div className="max-h-56 space-y-1 overflow-auto rounded-md border bg-background p-2 text-sm">
                    {tables.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handlePreviewTable(name)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-muted ${
                          selectedTable === name ? "bg-muted" : ""
                        }`}
                      >
                        <span>{name}</span>
                        <span className="text-xs text-muted-foreground">
                          Preview
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTable && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        Preview: {selectedTable}
                      </h3>
                      {previewLoading && (
                        <span className="text-xs text-muted-foreground">
                          Loading rows...
                        </span>
                      )}
                    </div>
                    {previewError && (
                      <span className="text-xs text-red-600">
                        {previewError}
                      </span>
                    )}
                    {previewRows && previewRows.length > 0 && (
                      <div className="max-h-56 overflow-auto rounded-md border bg-background p-2 text-xs">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(previewRows, null, 2)}
                        </pre>
                      </div>
                    )}
                    {previewRows &&
                      previewRows.length === 0 &&
                      !previewLoading &&
                      !previewError && (
                        <span className="text-xs text-muted-foreground">
                          No rows found for this table.
                        </span>
                      )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">
                  RAG ingestion from database
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ingest rows from all public tables into your organization RAG
                  namespace.
                </p>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Rows per table (max 200)</Label>
                  <Input
                    className="h-8 w-24"
                    type="number"
                    min={1}
                    max={200}
                    value={limitPerTable}
                    onChange={(e) => setLimitPerTable(e.target.value)}
                    disabled={ingesting}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleIngest} disabled={ingesting}>
                    {ingesting ? "Ingesting..." : "Ingest to RAG"}
                  </Button>
                  {ingestStatus && (
                    <span
                      className={
                        ingestStatus.success
                          ? "text-xs text-green-600"
                          : "text-xs text-red-600"
                      }
                    >
                      {ingestStatus.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
