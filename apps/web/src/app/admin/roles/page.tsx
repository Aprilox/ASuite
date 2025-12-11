'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAdmin } from '@/hooks/use-admin';
import {
  Plus,
  Shield,
  Users,
  Trash2,
  Loader2,
  ChevronRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string;
  isSystem: boolean;
  priority: number;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

export default function AdminRolesPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const t = useTranslations('admin.roles');
  const { hasPermission, highestPriority, canActOnRole, roles: userRoles } = useAdmin();
  
  // Permissions
  const canCreate = hasPermission('roles.create');
  const canEdit = hasPermission('roles.edit');
  const canDelete = hasPermission('roles.delete');
  const canReorder = hasPermission('roles.reorder');

  const [roles, setRoles] = useState<Role[]>([]);
  const [originalRoles, setOriginalRoles] = useState<Role[]>([]); // Ordre original avant édition
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editPriorityMode, setEditPriorityMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedRole, setDraggedRole] = useState<string | null>(null);
  const [dragOverRole, setDragOverRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#6366f1',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles);
      }
    } catch (error) {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });

      if (res.ok) {
        toast.success(t('createSuccess'));
        setShowCreate(false);
        setNewRole({ name: '', displayName: '', description: '', color: '#6366f1' });
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.error || t('createError'));
      }
    } catch (error) {
      toast.error(t('createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (role: Role) => {
    const confirmed = await confirm({
      title: t('deleteRole'),
      message: t('deleteConfirm', { name: role.displayName }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success(t('deleteSuccess'));
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.error || t('deleteError'));
      }
    } catch (error) {
      toast.error(t('deleteError'));
    }
  };

  // Drag & Drop pour réorganiser les priorités
  const handleDragStart = (e: React.DragEvent, roleId: string) => {
    setDraggedRole(roleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, roleId: string) => {
    e.preventDefault();
    if (draggedRole && draggedRole !== roleId) {
      setDragOverRole(roleId);
    }
  };

  const handleDragLeave = () => {
    setDragOverRole(null);
  };

  const handleDrop = (e: React.DragEvent, targetRoleId: string) => {
    e.preventDefault();
    if (!draggedRole || draggedRole === targetRoleId) {
      setDraggedRole(null);
      setDragOverRole(null);
      return;
    }

    const draggedRoleData = roles.find(r => r.id === draggedRole);
    const targetRoleData = roles.find(r => r.id === targetRoleId);

    if (!draggedRoleData || !targetRoleData) {
      setDraggedRole(null);
      setDragOverRole(null);
      return;
    }

    // Vérifier qu'on peut réorganiser ces rôles (pas système et priorité inférieure)
    if (draggedRoleData.isSystem || targetRoleData.isSystem) {
      toast.error(t('cannotReorderSystemRole'));
      setDraggedRole(null);
      setDragOverRole(null);
      return;
    }

    // Vérifier les droits de hiérarchie
    if (!canActOnRole(draggedRoleData.id, draggedRoleData.priority) || 
        !canActOnRole(targetRoleData.id, targetRoleData.priority)) {
      toast.error(t('cannotReorderHigherRole'));
      setDraggedRole(null);
      setDragOverRole(null);
      return;
    }

    // Réorganiser localement (pas d'appel API)
    reorderRolesLocally(draggedRole, targetRoleId);
    setDraggedRole(null);
    setDragOverRole(null);
  };

  const handleDragEnd = () => {
    setDraggedRole(null);
    setDragOverRole(null);
  };

  // Réorganiser localement (sans appel API)
  const reorderRolesLocally = (draggedId: string, targetId: string) => {
    const newRoles = [...roles];
    const draggedIndex = newRoles.findIndex(r => r.id === draggedId);
    const targetIndex = newRoles.findIndex(r => r.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Retirer l'élément dragged et l'insérer à la position target
    const [removed] = newRoles.splice(draggedIndex, 1);
    newRoles.splice(targetIndex, 0, removed);
    
    // Ne PAS recalculer les priorités localement
    // On garde les priorités originales, seul l'ordre visuel change
    // L'API calculera les vraies priorités lors de l'enregistrement
    
    setRoles(newRoles);
    setHasChanges(true);
  };

  // Enregistrer les changements (appel API)
  const saveReorder = async () => {
    setSaving(true);
    try {
      // Envoyer uniquement les rôles que l'utilisateur peut modifier
      // (pas système ET priorité inférieure à la sienne)
      const newOrder = roles
        .filter(r => !r.isSystem && r.priority > highestPriority)
        .map(r => r.id);
      
      if (newOrder.length === 0) {
        toast.error(t('noRolesToReorder'));
        setSaving(false);
        return;
      }
      
      const res = await fetch('/api/admin/roles/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder }),
      });

      if (res.ok) {
        toast.success(t('reorderSuccess'));
        setEditPriorityMode(false);
        setHasChanges(false);
        setOriginalRoles([]);
        fetchRoles(); // Recharger pour avoir les vraies priorités
      } else {
        const data = await res.json();
        // Traduire les erreurs de l'API
        const errorKey = data.errorKey;
        if (errorKey) {
          toast.error(t(errorKey));
        } else {
          toast.error(data.error || t('reorderError'));
        }
      }
    } catch (error) {
      toast.error(t('reorderError'));
    } finally {
      setSaving(false);
    }
  };

  // Annuler les changements
  const cancelReorder = () => {
    if (originalRoles.length > 0) {
      setRoles(originalRoles);
    }
    setEditPriorityMode(false);
    setHasChanges(false);
    setOriginalRoles([]);
  };

  // Entrer en mode édition
  const enterEditMode = () => {
    setOriginalRoles([...roles]); // Sauvegarder l'ordre actuel
    setEditPriorityMode(true);
    setHasChanges(false);
  };

  // Boutons flèches pour mobile
  const moveRole = (roleId: string, direction: 'up' | 'down') => {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) return;

    const role = roles[roleIndex];
    
    // Trouver le rôle cible (en sautant les rôles système)
    let targetIndex = direction === 'up' ? roleIndex - 1 : roleIndex + 1;
    while (targetIndex >= 0 && targetIndex < roles.length && roles[targetIndex].isSystem) {
      targetIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1;
    }

    if (targetIndex < 0 || targetIndex >= roles.length) return;

    const targetRole = roles[targetIndex];

    // Vérifier les droits
    if (!canActOnRole(role.id, role.priority) || !canActOnRole(targetRole.id, targetRole.priority)) {
      toast.error(t('cannotReorderHigherRole'));
      return;
    }

    reorderRolesLocally(roleId, targetRole.id);
  };

  const colors = [
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
    '#0d9488', '#0891b2', '#2563eb', '#7c3aed', '#c026d3',
    '#db2777', '#6366f1',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Bouton mode édition priorité - nécessite roles.reorder */}
          {canReorder && !editPriorityMode && (
            <button
              onClick={enterEditMode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
            >
              <GripVertical className="w-4 h-4" />
              {t('editPriority')}
            </button>
          )}
          
          {/* Bouton créer - nécessite roles.create */}
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              {t('createRole')}
            </button>
          )}
        </div>
      </div>
      
      {/* Bannière mode édition */}
      {editPriorityMode && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GripVertical className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">{t('priorityModeTitle')}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">{t('priorityModeDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={cancelReorder}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-medium disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={saveReorder}
              disabled={saving || !hasChanges}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('saveChanges')}
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && canCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-card rounded-xl border shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">{t('createRole')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('name')}</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="support, moderator..."
                  required
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('displayName')}</label>
                <input
                  type="text"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  placeholder="Support, Modérateur..."
                  required
                  className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('description')}</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder={t('descriptionPlaceholder')}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('color')}</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewRole({ ...newRole, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        newRole.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 h-10 rounded-lg border hover:bg-accent"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('noRoles')}
          </div>
        ) : (
          roles.map((role, index) => {
            const isOwnRole = userRoles.some(r => r.id === role.id);
            const canReorderThisRole = canReorder && editPriorityMode && !role.isSystem && !isOwnRole && canActOnRole(role.id, role.priority);
            const isFirst = index === 0 || (index === 1 && roles[0].isSystem);
            const isLast = index === roles.length - 1;
            
            return (
            <div
              key={role.id}
              draggable={canReorderThisRole}
              onDragStart={(e) => canReorderThisRole && handleDragStart(e, role.id)}
              onDragOver={(e) => handleDragOver(e, role.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, role.id)}
              onDragEnd={handleDragEnd}
              className={`bg-card rounded-xl border p-5 transition-all ${
                draggedRole === role.id ? 'opacity-50 scale-95' : ''
              } ${
                dragOverRole === role.id ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'
              } ${canReorderThisRole ? 'cursor-grab active:cursor-grabbing' : ''} ${
                isOwnRole ? 'opacity-60 ring-2 ring-primary/30' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Poignée de drag */}
                {canReorderThisRole && (
                  <div className="hidden sm:flex flex-col items-center gap-1">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      #{role.priority}
                    </span>
                  </div>
                )}
                {/* Boutons flèches pour mobile */}
                {canReorderThisRole && (
                  <div className="flex sm:hidden flex-col gap-1">
                    <button
                      onClick={() => moveRole(role.id, 'up')}
                      disabled={isFirst || saving}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveRole(role.id, 'down')}
                      disabled={isLast || saving}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <Shield className="w-6 h-6" style={{ color: role.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{role.displayName}</h3>
                    {role.isSystem && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {t('systemRole')}
                      </span>
                    )}
                    {isOwnRole && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                        {t('ownRoleDisabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description || t('noDescription')}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{role.userCount} {t('users')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>{role.permissions.length} {t('permissions')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Supprimer - nécessite roles.delete, pas système et pas propre rôle */}
                  {canDelete && !role.isSystem && !isOwnRole && (
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={role.userCount > 0}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={role.userCount > 0 ? t('cannotDeleteWithUsers') : t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Voir les détails - toujours visible */}
                  <button
                    onClick={() => router.push(`/admin/roles/${role.id}`)}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}

