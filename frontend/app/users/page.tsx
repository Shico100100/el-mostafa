'use client';

import { useUsers } from '@/hooks/users/useUsers';
import { UsersHeader } from '@/components/users/UsersHeader';
import { UsersTable } from '@/components/users/UsersTable';
import { UserFormModal } from '@/components/users/UserFormModal';

export default function UsersPage() {
  const h = useUsers();

  if (h.loading) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

  const isEditing = h.editingUser !== null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100" dir="rtl">
      <UsersHeader onNewUser={h.startNew} />

      <main className="container mx-auto px-6 py-8">
        <UsersTable users={h.users} onEdit={h.startEdit} onDelete={h.handleDelete} />
      </main>

      <UserFormModal
        show={h.showRegisterDialog}
        editing={isEditing}
        formData={h.formData}
        onFormChange={h.setFormData}
        onSave={h.handleSave}
        onClose={() => { h.setShowRegisterDialog(false); h.setFormData({ email: '', password: '', firstName: '', lastName: '', role: { id: 2 }, status: { id: 1 } }); }}
      />
    </div>
  );
}
