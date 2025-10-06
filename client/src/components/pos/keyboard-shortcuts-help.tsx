import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { POS_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsHelpProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps = {}) {
  const shortcuts = [
    { key: POS_SHORTCUTS.HELP, description: "Показать справку" },
    { key: POS_SHORTCUTS.OPEN_PAYMENT, description: "Инициировать оплату" },
    { key: POS_SHORTCUTS.CLEAR_CART, description: "Очистить корзину" },
    { key: POS_SHORTCUTS.CANCEL, description: "Отмена/закрыть модальное окно" },
    { key: POS_SHORTCUTS.BARCODE_SCANNER, description: "Сканер штрих-кода" },
    { key: POS_SHORTCUTS.ADD_CUSTOMER, description: "Добавить клиента" },
    { key: POS_SHORTCUTS.INCREASE_QTY, description: "Увеличить количество" },
    { key: POS_SHORTCUTS.DECREASE_QTY, description: "Уменьшить количество" },
    { key: POS_SHORTCUTS.COMPLETE_PAYMENT, description: "Завершить оплату" },
    { key: POS_SHORTCUTS.OPEN_SHIFT, description: "Открыть смену" },
    { key: POS_SHORTCUTS.CLOSE_SHIFT, description: "Закрыть смену" },
    { key: POS_SHORTCUTS.PRINT_RECEIPT, description: "Печать чека" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" data-testid="keyboard-shortcuts-button">
          <Keyboard className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Клавиатурные сокращения</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-muted-foreground mb-2">
            Используйте эти клавиатурные сокращения для быстрой работы:
          </div>
          <div className="grid grid-cols-2 gap-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Совет:</strong> Горячие клавиши не работают когда вы вводите текст в поля ввода.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
