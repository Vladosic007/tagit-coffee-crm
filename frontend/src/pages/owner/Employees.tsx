import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Employee } from '../../lib/types';
import { cn } from '../../lib/cn';

export default function Employees() {
  const employees = useStore((s) => s.employees);
  const createEmployee = useStore((s) => s.createEmployee);
  const updateEmployee = useStore((s) => s.updateEmployee);
  const deleteEmployee = useStore((s) => s.deleteEmployee);
  const currentEmployeeId = useStore((s) => s.currentEmployeeId);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b border-line bg-white flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold text-ink">Сотрудники</div>
          <div className="text-sm text-muted">PIN — 4 цифры, роль определяет права доступа</div>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setCreating(true)}>
          Добавить сотрудника
        </Button>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="grid grid-cols-[1fr,140px,100px,120px,180px] gap-3 px-5 py-3 text-xs uppercase tracking-wide text-muted border-b border-line font-semibold">
            <div>Имя</div>
            <div>Роль</div>
            <div>PIN</div>
            <div>Статус</div>
            <div className="text-right">Действия</div>
          </div>
          {employees.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1fr,140px,100px,120px,180px] gap-3 px-5 py-4 items-center border-b last:border-b-0 border-line"
            >
              <div className="font-semibold text-ink flex items-center gap-2">
                {e.name}
                {e.id === currentEmployeeId && (
                  <span className="text-xs bg-coffee-50 text-coffee px-2 py-0.5 rounded-md">Вы</span>
                )}
              </div>
              <div>
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-1 rounded-md',
                    e.role === 'owner' ? 'bg-coffee text-white' : 'bg-cream text-ink'
                  )}
                >
                  {e.role === 'owner' ? 'Владелец' : 'Бариста'}
                </span>
              </div>
              <div className="font-mono">••••</div>
              <div>
                {e.isActive ? (
                  <span className="text-success text-xs font-semibold bg-success/10 px-2 py-1 rounded-md">
                    Активен
                  </span>
                ) : (
                  <span className="text-muted text-xs font-semibold bg-cream px-2 py-1 rounded-md">
                    Отключён
                  </span>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(e)}
                  className="w-10 h-10 rounded-lg bg-cream hover:bg-coffee-50 flex items-center justify-center"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    if (e.id === currentEmployeeId) {
                      alert('Нельзя удалить себя');
                      return;
                    }
                    if (confirm(`Удалить «${e.name}»?`)) deleteEmployee(e.id);
                  }}
                  className="w-10 h-10 rounded-lg bg-cream hover:bg-error/10 hover:text-error flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <EmployeeEditor
          employee={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateEmployee(editing.id, patch);
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <EmployeeEditor
          employee={{ id: '', name: '', role: 'barista', pin: '', isActive: true }}
          onClose={() => setCreating(false)}
          onSave={(patch) => {
            createEmployee({
              name: patch.name ?? '',
              role: patch.role ?? 'barista',
              pin: patch.pin ?? '',
            });
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function EmployeeEditor({
  employee,
  onClose,
  onSave,
}: {
  employee: Employee;
  onClose: () => void;
  onSave: (patch: Partial<Employee>) => void;
}) {
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState<Employee['role']>(employee.role);
  const [pin, setPin] = useState(employee.pin);
  const [active, setActive] = useState(employee.isActive);

  const valid = name.trim() && /^\d{4}$/.test(pin);

  return (
    <Modal
      open
      onClose={onClose}
      title={employee.id ? `Сотрудник: ${employee.name}` : 'Новый сотрудник'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button block variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            block
            disabled={!valid}
            onClick={() =>
              onSave({ name: name.trim(), role, pin, isActive: active })
            }
          >
            Сохранить
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-xs text-muted mb-1">Имя</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 rounded-xl border border-line px-4 focus:border-coffee"
          />
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Роль</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRole('barista')}
              className={cn(
                'h-14 rounded-xl border-2 font-semibold',
                role === 'barista' ? 'border-coffee bg-coffee-50 text-coffee' : 'border-line'
              )}
            >
              Бариста
            </button>
            <button
              onClick={() => setRole('owner')}
              className={cn(
                'h-14 rounded-xl border-2 font-semibold',
                role === 'owner' ? 'border-coffee bg-coffee-50 text-coffee' : 'border-line'
              )}
            >
              Владелец
            </button>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">PIN (4 цифры)</div>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full h-14 rounded-xl border border-line px-4 focus:border-coffee font-mono tracking-widest text-2xl text-center"
            placeholder="••••"
          />
        </div>
        <label className="flex items-center gap-3 select-none">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="font-medium">Активен</span>
        </label>
      </div>
    </Modal>
  );
}
