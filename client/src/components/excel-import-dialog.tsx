import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import * as XLSX from "xlsx";

interface ParsedParticipant {
  fullName: string;
  phone: string;
  position?: string;
  isValid: boolean;
  error?: string;
}

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffGroupId: string;
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  staffGroupId,
}: ExcelImportDialogProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedParticipant[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const importMutation = useMutation({
    mutationFn: async (participants: ParsedParticipant[]) => {
      const validParticipants = participants
        .filter((p) => p.isValid)
        .map((p) => ({
          fullName: p.fullName,
          phone: p.phone,
          position: p.position,
          staffGroupId,
        }));

      return await apiRequest("POST", "/api/participants/bulk", {
        participants: validParticipants,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/staff-groups", staffGroupId, "participants"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups"] });
      onOpenChange(false);
      setParsedData([]);
      setFileName("");
      toast({
        title: "Импорт завершён",
        description: `Добавлено ${data.count || parsedData.filter(p => p.isValid).length} участников`,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать участников",
        variant: "destructive",
      });
    },
  });

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);

        const parsed: ParsedParticipant[] = jsonData.map((row) => {
          const fullName =
            row["ФИО"] || row["Имя"] || row["Name"] || row["fullName"] || "";
          const phone =
            row["Телефон"] || row["Phone"] || row["phone"] || row["Номер"] || "";
          const position =
            row["Должность"] || row["Position"] || row["position"] || "";

          const isValidName = fullName.trim().length >= 2;
          const isValidPhone = phone.toString().replace(/\D/g, "").length >= 10;

          let error: string | undefined;
          if (!isValidName) error = "Некорректное ФИО";
          else if (!isValidPhone) error = "Некорректный телефон";

          return {
            fullName: fullName.toString().trim(),
            phone: phone.toString().trim(),
            position: position.toString().trim() || undefined,
            isValid: isValidName && isValidPhone,
            error,
          };
        });

        setParsedData(parsed);
        setFileName(file.name);
      } catch (error) {
        toast({
          title: "Ошибка чтения файла",
          description: "Не удалось прочитать Excel файл",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        parseExcelFile(file);
      } else {
        toast({
          title: "Неверный формат",
          description: "Пожалуйста, загрузите файл Excel (.xlsx или .xls)",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseExcelFile(files[0]);
    }
  };

  const handleImport = () => {
    importMutation.mutate(parsedData);
  };

  const validCount = parsedData.filter((p) => p.isValid).length;
  const invalidCount = parsedData.filter((p) => !p.isValid).length;

  const handleClose = () => {
    onOpenChange(false);
    setParsedData([]);
    setFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Импорт из Excel
          </DialogTitle>
          <DialogDescription>
            Загрузите файл Excel с колонками: ФИО, Телефон, Должность (опционально)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {parsedData.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Перетащите файл сюда
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                или нажмите для выбора файла
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="excel-file-input"
                data-testid="input-excel-file"
              />
              <label htmlFor="excel-file-input">
                <Button variant="outline" asChild>
                  <span>Выбрать файл</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-500" />
                  <span className="font-medium">{fileName}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setParsedData([]);
                      setFileName("");
                    }}
                    data-testid="button-clear-file"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {validCount} корректных
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      {invalidCount} с ошибками
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-lg border max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>ФИО</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Должность</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow
                        key={index}
                        className={!row.isValid ? "bg-red-50 dark:bg-red-900/10" : ""}
                      >
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            {row.fullName || (
                              <span className="text-muted-foreground italic">
                                Пусто
                              </span>
                            )}
                            {row.error && (
                              <div className="text-xs text-red-500">
                                {row.error}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.phone || (
                            <span className="text-muted-foreground italic">
                              Пусто
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.position || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleImport}
            disabled={validCount === 0 || importMutation.isPending}
            data-testid="button-import-excel"
          >
            {importMutation.isPending
              ? "Импорт..."
              : `Импортировать (${validCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
