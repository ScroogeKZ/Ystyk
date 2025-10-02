import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, UserCog, Shield, User as UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as importedQueryClient } from "@/lib/queryClient";
import { z } from "zod";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string(),
  role: z.enum(['admin', 'cashier']),
  email: z.string().email("Invalid email").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  email: string | null;
  createdAt: Date;
}

export default function UsersManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "cashier",
      email: "",
    },
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Успех",
        description: "Пользователь создан",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать пользователя",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      form.reset();
      toast({
        title: "Успех",
        description: "Пользователь обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить пользователя",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успех",
        description: "Пользователь удален",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      // For editing, validate password only if provided
      if (data.password && data.password.length > 0 && data.password.length < 6) {
        form.setError('password', { message: 'Password must be at least 6 characters' });
        return;
      }
      
      const updates: any = { 
        username: data.username,
        role: data.role,
        email: data.email || null
      };
      if (data.password && data.password.length > 0) {
        updates.password = data.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updates });
    } else {
      // For creating, password is required
      if (!data.password || data.password.length < 6) {
        form.setError('password', { message: 'Password must be at least 6 characters' });
        return;
      }
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: "",
      role: user.role,
      email: user.email || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingUser(null);
    form.reset();
  };

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'cashier':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление пользователями</h1>
          <p className="text-muted-foreground mt-1">
            Создавайте и управляйте учетными записями пользователей системы
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="w-4 h-4 mr-2" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Редактировать пользователя" : "Создать пользователя"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя пользователя</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="username"
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {editingUser ? "Новый пароль (оставьте пустым для сохранения текущего)" : "Пароль *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          data-testid="input-password"
                          required={!editingUser}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cashier">Кассир</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (опционально)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="user@example.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-user"
                  >
                    {editingUser ? "Сохранить" : "Создать"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Список пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет пользователей
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getRoleIcon(user.role)}
                        {user.role === 'admin' ? 'Администратор' : 'Кассир'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
