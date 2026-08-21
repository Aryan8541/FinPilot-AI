"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";

type ImportStep = "upload" | "mapping" | "complete";

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvText, setCsvText] = useState("");
  const [filename, setFilename] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [mapping, setMapping] = useState({
    amount: "",
    date: "",
    description: "",
    accountId: "",
    categoryId: "",
  });
  const [importResult, setImportResult] = useState<any>(null);

  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const previewMutation = trpc.import.preview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setStep("mapping");
    },
  });

  const commitMutation = trpc.import.commit.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setStep("complete");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      previewMutation.mutate({ csvText: text });
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    commitMutation.mutate({
      csvText,
      mapping,
      filename,
    });
  };

  const canImport =
    mapping.amount &&
    mapping.date &&
    mapping.description &&
    mapping.accountId &&
    mapping.categoryId;

  return (
    <div>
      <h1 className="text-3xl font-bold">Import Transactions</h1>
      <p className="mt-2 text-muted-foreground">
        Upload a CSV file from your bank or financial institution
      </p>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Step 1: Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <Label
                htmlFor="csv-upload"
                className="cursor-pointer text-primary hover:underline"
              >
                Click to upload CSV
              </Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Supported format: CSV files only
              </p>
            </div>
            {previewMutation.isPending && (
              <p className="mt-4 text-center text-sm">Processing file...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && previewData && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Map CSV Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {previewData.totalRows} rows. Map your CSV columns to transaction
                fields.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Amount Column *</Label>
                  <Select
                    value={mapping.amount}
                    onValueChange={(value) => setMapping({ ...mapping, amount: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {previewData.headers.map((header: string) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Column *</Label>
                  <Select
                    value={mapping.date}
                    onValueChange={(value) => setMapping({ ...mapping, date: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {previewData.headers.map((header: string) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description Column *</Label>
                  <Select
                    value={mapping.description}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, description: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {previewData.headers.map((header: string) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Account *</Label>
                  <Select
                    value={mapping.accountId}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, accountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Category *</Label>
                  <Select
                    value={mapping.categoryId}
                    onValueChange={(value) =>
                      setMapping({ ...mapping, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={!canImport || commitMutation.isPending}
                  className="flex-1"
                >
                  {commitMutation.isPending
                    ? "Importing..."
                    : `Import ${previewData.totalRows} Transactions`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setPreviewData(null);
                    setCsvText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Sample Rows */}
          <Card>
            <CardHeader>
              <CardTitle>Preview (First 5 rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {previewData.headers.map((header: string) => (
                        <th key={header} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.sampleRows.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        {previewData.headers.map((header: string) => (
                          <td key={header} className="p-2">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === "complete" && importResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <div className="text-left">
                  <p className="text-2xl font-bold">{importResult.imported}</p>
                  <p className="text-sm">Imported</p>
                </div>
              </div>
              {importResult.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-8 w-8" />
                  <div className="text-left">
                    <p className="text-2xl font-bold">{importResult.failed}</p>
                    <p className="text-sm">Failed</p>
                  </div>
                </div>
              )}
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-4 text-left">
                <p className="font-medium mb-2">Errors (first 10):</p>
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  {importResult.errors.map((error: string, idx: number) => (
                    <p key={idx} className="text-red-600">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <Button
                onClick={() => {
                  setStep("upload");
                  setPreviewData(null);
                  setCsvText("");
                  setImportResult(null);
                  setMapping({
                    amount: "",
                    date: "",
                    description: "",
                    accountId: "",
                    categoryId: "",
                  });
                }}
                className="flex-1"
              >
                Import Another File
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/transactions")}>
                View Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
