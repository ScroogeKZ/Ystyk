import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import type { AuditLog } from "@shared/schema";

export default function AuditLogsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  const getActionBadgeVariant = (action: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      "login": "default",
      "logout": "secondary",
      "create": "default",
      "update": "outline",
      "delete": "destructive",
      "approve": "default",
    };
    return variants[action] || "secondary";
  };

  return (
    <div className="flex-1 overflow-auto p-4" data-testid="audit-logs-tab">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Журнал аудита
              </CardTitle>
              <CardDescription>
                История всех действий пользователей в системе
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по действию, сущности или пользователю..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-logs"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-action-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Фильтр по действию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Тип сущности</TableHead>
                  <TableHead>ID сущности</TableHead>
                  <TableHead>IP адрес</TableHead>
                  <TableHead>Изменения</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Записи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-log-${log.id}`}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{log.userId}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell>
                        {log.entityId ? (
                          <code className="text-xs">{log.entityId}</code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.ipAddress || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {log.changes ? (
                          <details className="cursor-pointer">
                            <summary className="text-sm text-blue-600">
                              Показать
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="mt-4 text-sm text-muted-foreground">
            Всего записей: {filteredLogs.length} из {logs.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
