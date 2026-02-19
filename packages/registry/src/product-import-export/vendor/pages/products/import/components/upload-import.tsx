import { useState } from "react";
import { Button, toast } from "@medusajs/ui";
import { Trash } from "@medusajs/icons";

import { FileUpload, FilePreview } from "@mercurjs/dashboard-shared";
import type { FileType } from "@mercurjs/dashboard-shared";
import { useImportProducts } from "../../../../hooks/api/product-import-export";
import { downloadImportTemplate } from "../helpers/import-template";

type UploadImportProps = {
  onSuccess: (summary: { created: number }) => void;
};

export const UploadImport = ({ onSuccess }: UploadImportProps) => {
  const [file, setFile] = useState<FileType | null>(null);

  const { mutateAsync: importProducts, isPending } = useImportProducts({
    onSuccess: (data) => {
      toast.success(
        `Successfully imported ${data.summary?.created ?? 0} product(s).`,
      );
      onSuccess(data.summary);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (files: FileType[]) => {
    if (files.length > 0) {
      setFile(files[0] ?? null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    await importProducts(file.file);
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
        <span className="text-ui-fg-subtle txt-small">
          Upload a CSV file with your products. You can{" "}
          <button
            type="button"
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
            onClick={downloadImportTemplate}
          >
            download the template
          </button>{" "}
          to get started.
        </span>
      </div>

      {!file ? (
        <FileUpload
          label="Upload CSV file"
          hint="Only .csv files are supported"
          formats={[".csv", "text/csv"]}
          onUploaded={handleFileUpload}
          multiple={false}
        />
      ) : (
        <FilePreview
          filename={file.file.name}
          loading={isPending}
          activity="Importing products..."
          actions={[
            {
              actions: [
                {
                  icon: <Trash />,
                  label: "Remove",
                  onClick: handleRemoveFile,
                },
              ],
            },
          ]}
        />
      )}

      {file && (
        <div className="flex justify-end">
          <Button onClick={handleImport} isLoading={isPending} disabled={!file}>
            Import Products
          </Button>
        </div>
      )}
    </div>
  );
};
