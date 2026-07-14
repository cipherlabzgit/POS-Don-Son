'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  KeyRound,
  Loader2,
  Plus,
  Save,
  Search,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { rolesApi, type Role } from '@/lib/api/roles';
import { permissionsApi, type Permission } from '@/lib/api/permissions';
import {
  ACTION_LABELS,
  ACTION_ORDER,
  PERMISSION_SECTIONS,
  type ActionKey,
  type SectionDef,
} from '@/lib/auth/permission-map';

export interface PermissionsManagerProps {
  /** Omit page chrome when shown inside Security hub (avoids duplicate titles / padding). */
  embedded?: boolean;
}

/**
 * Roles & permissions matrix: role list + section/action checkboxes.
 * Used on `/administrator/security?tab=permissions` (embedded) and legacy `/administrator/permissions` redirect.
 */
export function PermissionsManager({ embedded = false }: PermissionsManagerProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  async function loadInitial() {
    setLoading(true);
    try {
      const [rolesResp, perms] = await Promise.all([
        rolesApi.getAll(1, 200, '', true),
        permissionsApi.getAll(true),
      ]);
      setRoles(rolesResp.roles);
      setAllPermissions(perms);
      if (rolesResp.roles.length > 0) {
        setSelectedRole((curr) => curr ?? rolesResp.roles[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load roles & permissions');
    } finally {
      setLoading(false);
    }
  }

  async function loadRolePermissions(roleId: string) {
    setLoadingRolePerms(true);
    try {
      const role = await rolesApi.getById(roleId);
      const ids = new Set((role.permissions ?? []).map((p) => p.id));
      setSelectedIds(ids);
      setOriginalIds(new Set(ids));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load role permissions');
    } finally {
      setLoadingRolePerms(false);
    }
  }

  const permissionByCode = useMemo(() => {
    const map = new Map<string, Permission>();
    for (const p of allPermissions) map.set(p.code, p);
    return map;
  }, [allPermissions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial roles/permissions load
    void loadInitial();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load matrix for selected role
      void loadRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== originalIds.size) return true;
    for (const id of selectedIds) if (!originalIds.has(id)) return true;
    return false;
  }, [selectedIds, originalIds]);

  const unmappedPermissions = useMemo(() => {
    const known = new Set<string>();
    for (const section of PERMISSION_SECTIONS) {
      if (section.modulePermission) known.add(section.modulePermission);
      for (const sub of section.subsections) {
        for (const code of Object.values(sub.actions)) {
          if (code) known.add(code);
        }
      }
    }
    return allPermissions
      .filter((p) => !known.has(p.code))
      .sort((a, b) => a.module.localeCompare(b.module) || a.code.localeCompare(b.code));
  }, [allPermissions]);

  const visibleSections = useMemo(() => PERMISSION_SECTIONS.filter((s) => !s.hideFromPermissions), []);
  const filteredSections = useMemo(() => filterSections(visibleSections, search), [visibleSections, search]);

  function toggle(code: string | undefined, checked: boolean) {
    if (!code) return;
    const perm = permissionByCode.get(code);
    if (!perm) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(perm.id);
      else next.delete(perm.id);
      return next;
    });
  }

  function toggleMany(codes: (string | undefined)[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const code of codes) {
        if (!code) continue;
        const perm = permissionByCode.get(code);
        if (!perm) continue;
        if (checked) next.add(perm.id);
        else next.delete(perm.id);
      }
      return next;
    });
  }

  function isCodeChecked(code: string | undefined): boolean {
    if (!code) return false;
    const perm = permissionByCode.get(code);
    return perm ? selectedIds.has(perm.id) : false;
  }

  function isSubsectionFullyChecked(actions: (string | undefined)[]): boolean | 'partial' {
    const known = actions.filter((c): c is string => Boolean(c) && permissionByCode.has(c));
    if (known.length === 0) return false;
    const checked = known.filter(isCodeChecked).length;
    if (checked === 0) return false;
    if (checked === known.length) return true;
    return 'partial';
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rolesApi.assignPermissions(selectedRole.id, Array.from(selectedIds));
      toast.success(`Saved ${selectedIds.size} permissions for ${selectedRole.name}`);
      setOriginalIds(new Set(selectedIds));
    } catch (err: unknown) {
      console.error(err);
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSelectedIds(new Set(originalIds));
  }

  function selectAllInSection(section: SectionDef, checked: boolean) {
    const codes: string[] = [];
    if (section.modulePermission) codes.push(section.modulePermission);
    for (const sub of section.subsections) {
      for (const code of Object.values(sub.actions)) {
        if (code) codes.push(code);
      }
    }
    toggleMany(codes, checked);
  }

  const isSuperAdmin = useMemo(() => {
    if (allPermissions.length === 0) return false;
    return selectedIds.size === allPermissions.length;
  }, [selectedIds, allPermissions]);

  function toggleSuperAdmin(checked: boolean) {
    if (checked) {
      // Select all permissions
      const allIds = new Set(allPermissions.map((p) => p.id));
      setSelectedIds(allIds);
    } else {
      // Deselect all permissions
      setSelectedIds(new Set());
    }
  }

  const toolbar = (
    <div className="flex items-center justify-end gap-2">
      {hasChanges && !saving && (
        <Button variant="ghost" size="sm" onClick={reset}>
          Discard
        </Button>
      )}
      <Button
        variant="primary"
        size="sm"
        onClick={save}
        disabled={!hasChanges || saving || !selectedRole}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );

  const titleBlock = !embedded && (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
          <KeyRound className="w-8 h-8" style={{ color: '#C8102E' }} />
          Roles & Permissions
        </h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Pick a role on the left, then tick the actions it should be allowed to perform. Only checked actions
          will work for users assigned to this role.
        </p>
      </div>
      {toolbar}
    </div>
  );

  const matrixCard = (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            <aside
              className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="p-4 border-b flex items-center justify-between gap-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  Roles
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/administrator/roles/add')}
                  title="Create a new role"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add role
                </Button>
              </div>
              <div className="p-2 space-y-1">
                {roles.map((role) => {
                  const active = selectedRole?.id === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: active ? '#3B82F6' : 'transparent',
                        color: active ? 'white' : 'var(--foreground)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {role.name}
                        </span>
                        {role.permissionCount !== undefined && (
                          <Badge variant={active ? 'neutral' : 'info'} size="sm">
                            {role.permissionCount}
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <div className="text-xs mt-0.5 opacity-75">{role.description}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex-1 overflow-x-auto">
              {!selectedRole ? (
                <EmptyState />
              ) : (
                <div className="p-6 space-y-4">
                  {/* Header with counts and search */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase">Permissions Selected</div>
                      <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        {selectedIds.size} <span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>of {allPermissions.length}</span>
                      </div>
                    </div>
                    <div className="relative flex-1 sm:flex-initial w-full sm:w-80">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                      <input
                        type="text"
                        placeholder="Filter by section or page…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
                        style={{ border: '1px solid var(--input)', backgroundColor: 'var(--card)' }}
                      />
                    </div>
                  </div>

                  {/* Super Admin Toggle */}
                  <div
                    className="flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSuperAdmin ? '#FEF3C7' : 'var(--card)',
                      borderColor: isSuperAdmin ? '#FCD34D' : 'var(--border)',
                    }}
                    onClick={() => toggleSuperAdmin(!isSuperAdmin)}
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 cursor-pointer"
                      style={{ accentColor: '#C8102E', flexShrink: 0 }}
                      checked={isSuperAdmin}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div
                        className="font-semibold flex items-center gap-2"
                        style={{ color: isSuperAdmin ? '#92400E' : 'var(--foreground)' }}
                      >
                        <Shield className="w-4 h-4" />
                        Super Admin Access
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: isSuperAdmin ? '#B45309' : 'var(--muted-foreground)' }}
                      >
                        Grant all {allPermissions.length} permissions to this role
                      </div>
                    </div>
                  </div>

                  {loadingRolePerms ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                  ) : (
                    <>
                      {filteredSections.map((section) => (
                        <SectionRow
                          key={section.id}
                          section={section}
                          collapsed={collapsed.has(section.id)}
                          onToggleCollapse={() => toggleCollapsed(section.id)}
                          onSelectAll={(checked) => selectAllInSection(section, checked)}
                          isCodeChecked={isCodeChecked}
                          isSubsectionFullyChecked={isSubsectionFullyChecked}
                          toggleCode={toggle}
                          toggleMany={toggleMany}
                          permissionByCode={permissionByCode}
                        />
                      ))}

                      {unmappedPermissions.length > 0 && (
                        <UnmappedSection
                          permissions={unmappedPermissions}
                          selectedIds={selectedIds}
                          onToggle={(id, checked) =>
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(id);
                              else next.delete(id);
                              return next;
                            })
                          }
                        />
                      )}

                      {filteredSections.length === 0 && (
                        <div className="text-center py-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          No sections match your filter.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        {toolbar}
        {matrixCard}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {titleBlock}
      {matrixCard}
    </div>
  );
}

const DATE_ACTIONS: ActionKey[] = ['allowBackDate', 'allowFutureDate'];
const CORE_ACTION_ORDER = ACTION_ORDER.filter((a) => !DATE_ACTIONS.includes(a));

interface SectionRowProps {
  section: SectionDef;
  collapsed: boolean;
  onToggleCollapse(): void;
  onSelectAll(checked: boolean): void;
  isCodeChecked(code: string | undefined): boolean;
  isSubsectionFullyChecked(actions: (string | undefined)[]): boolean | 'partial';
  toggleCode(code: string | undefined, checked: boolean): void;
  toggleMany(codes: (string | undefined)[], checked: boolean): void;
  permissionByCode: Map<string, Permission>;
}

function SectionRow({
  section,
  collapsed,
  onToggleCollapse,
  onSelectAll,
  isCodeChecked,
  isSubsectionFullyChecked,
  toggleCode,
  toggleMany,
  permissionByCode,
}: SectionRowProps) {
  const usedActions: ActionKey[] = useMemo(() => {
    const present = new Set<ActionKey>();
    for (const sub of section.subsections) {
      for (const key of Object.keys(sub.actions) as ActionKey[]) {
        present.add(key);
      }
    }
    return CORE_ACTION_ORDER.filter((a) => present.has(a));
  }, [section]);

  const usedDateActions: ActionKey[] = useMemo(() => {
    const present = new Set<ActionKey>();
    for (const sub of section.subsections) {
      for (const key of Object.keys(sub.actions) as ActionKey[]) {
        present.add(key);
      }
    }
    return DATE_ACTIONS.filter((a) => present.has(a));
  }, [section]);

  const sectionAllCodes = useMemo(() => {
    const codes: string[] = [];
    if (section.modulePermission) codes.push(section.modulePermission);
    for (const sub of section.subsections) {
      for (const c of Object.values(sub.actions)) if (c) codes.push(c);
    }
    return codes;
  }, [section]);

  const sectionFullyChecked = useMemo(() => {
    const known = sectionAllCodes.filter((c) => permissionByCode.has(c));
    if (known.length === 0) return false;
    const ticked = known.filter(isCodeChecked).length;
    if (ticked === 0) return false;
    if (ticked === known.length) return true;
    return 'partial' as const;
  }, [sectionAllCodes, permissionByCode, isCodeChecked]);

  const Icon = section.icon;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ backgroundColor: 'var(--muted)' }}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-3">
          {collapsed ? (
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          )}
          <Icon className="w-4 h-4" style={{ color: '#C8102E' }} />
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
            {section.name}
          </span>
          <Badge variant="neutral" size="sm">
            {section.subsections.length} pages
          </Badge>
        </div>
        <label
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
            style={{ accentColor: '#3B82F6' }}
            checked={sectionFullyChecked === true}
            ref={(el) => {
              if (el) el.indeterminate = sectionFullyChecked === 'partial';
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
          />
          Select all
        </label>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--muted)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '180px' }}>
                  Page / Feature
                </th>
                {usedActions.map((a) => (
                  <th
                    key={a}
                    className="text-center py-2 px-3 font-medium whitespace-nowrap"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {ACTION_LABELS[a]}
                  </th>
                ))}
                {usedDateActions.length > 0 && (
                  <th
                    className="text-center py-2 px-3 font-medium whitespace-nowrap"
                    style={{ color: 'var(--muted-foreground)', borderLeft: '1px dashed var(--border)' }}
                    title="Back-date and future-date access controls"
                  >
                    Date Access
                  </th>
                )}
                <th className="text-center py-2 px-3 font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  All
                </th>
              </tr>
            </thead>
            <tbody>
              {section.subsections.map((sub) => {
                const subCodes = Object.values(sub.actions).filter((c): c is string => Boolean(c));
                const subState = isSubsectionFullyChecked(subCodes);
                return (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 px-4">
                      <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {sub.name}
                      </div>
                      {sub.href && (
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {sub.href}
                        </div>
                      )}
                    </td>
                    {usedActions.map((action) => {
                      const code = sub.actions[action];
                      const known = code ? permissionByCode.has(code) : false;
                      const checked = isCodeChecked(code);
                      return (
                        <td key={action} className="text-center py-2 px-3">
                          {code ? (
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer"
                              style={{ accentColor: '#3B82F6' }}
                              checked={checked}
                              disabled={!known}
                              title={!known ? `Missing permission in DB: ${code}` : code}
                              onChange={(e) => toggleCode(code, e.target.checked)}
                            />
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }}>
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {usedDateActions.length > 0 && (
                      <td
                        className="py-2 px-3"
                        style={{ borderLeft: '1px dashed var(--border)' }}
                      >
                        <div className="flex flex-wrap gap-1 justify-center">
                          {usedDateActions.map((action) => {
                            const code = sub.actions[action];
                            if (!code) return null;
                            const known = permissionByCode.has(code);
                            const checked = isCodeChecked(code);
                            const label = action === 'allowBackDate' ? 'Back' : 'Future';
                            const color = action === 'allowBackDate' ? '#7C3AED' : '#0891B2';
                            return (
                              <button
                                key={action}
                                type="button"
                                title={`${ACTION_LABELS[action]}: ${code}`}
                                disabled={!known}
                                onClick={() => toggleCode(code, !checked)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none"
                                style={{
                                  backgroundColor: checked ? color : 'transparent',
                                  color: checked ? 'white' : 'var(--muted-foreground)',
                                  border: `1px solid ${checked ? color : 'var(--border)'}`,
                                  opacity: known ? 1 : 0.35,
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                    <td className="text-center py-2 px-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer"
                        style={{ accentColor: '#3B82F6' }}
                        checked={subState === true}
                        ref={(el) => {
                          if (el) el.indeterminate = subState === 'partial';
                        }}
                        onChange={(e) => toggleMany(subCodes, e.target.checked)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface PageGroup {
  page: string;
  perms: Permission[];
}

interface SectionGroup {
  section: string;
  pages: PageGroup[];
  allPerms: Permission[];
}

function UnmappedSection({
  permissions,
  selectedIds,
  onToggle,
}: {
  permissions: Permission[];
  selectedIds: Set<string>;
  onToggle(id: string, checked: boolean): void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  // Build Section → Page → Permissions from perm.module = "SectionName - PageName"
  const sections = useMemo((): SectionGroup[] => {
    const sectionMap = new Map<string, Map<string, Permission[]>>();
    for (const p of permissions) {
      const raw = p.module || 'Other';
      const dashIdx = raw.indexOf(' - ');
      const section = dashIdx >= 0 ? raw.slice(0, dashIdx).trim() : raw;
      const page = dashIdx >= 0 ? raw.slice(dashIdx + 3).trim() : 'General';
      if (!sectionMap.has(section)) sectionMap.set(section, new Map());
      const pageMap = sectionMap.get(section)!;
      if (!pageMap.has(page)) pageMap.set(page, []);
      pageMap.get(page)!.push(p);
    }
    return Array.from(sectionMap.entries())
      .map(([section, pageMap]) => {
        const pages: PageGroup[] = Array.from(pageMap.entries())
          .map(([page, perms]) => ({ page, perms: perms.sort((a, b) => a.name.localeCompare(b.name)) }))
          .sort((a, b) => a.page.localeCompare(b.page));
        return { section, pages, allPerms: pages.flatMap((pg) => pg.perms) };
      })
      .sort((a, b) => a.section.localeCompare(b.section));
  }, [permissions]);

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  }

  function togglePage(key: string) {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAll(perms: Permission[], checked: boolean) {
    for (const p of perms) onToggle(p.id, checked);
  }

  function checkState(perms: Permission[]): { checked: boolean; indeterminate: boolean } {
    const n = perms.filter((p) => selectedIds.has(p.id)).length;
    return { checked: n === perms.length && perms.length > 0, indeterminate: n > 0 && n < perms.length };
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
      {/* Top header — collapsed by default */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
        style={{ backgroundColor: 'var(--muted)' }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          {collapsed
            ? <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            : <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />}
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Other Permissions</span>
          <Badge variant="neutral" size="sm">{permissions.length}</Badge>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· {sections.length} sections</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          DB permissions not yet mapped to the sidebar
        </span>
      </div>

      {!collapsed && (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {sections.map(({ section, pages, allPerms }) => {
            const sectionExpanded = expandedSections.has(section);
            const { checked: sAll, indeterminate: sPartial } = checkState(allPerms);
            const sOn = allPerms.filter((p) => selectedIds.has(p.id)).length;

            return (
              <div key={section}>
                {/* Section row */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
                  style={{ backgroundColor: 'var(--muted)' }}
                  onClick={() => toggleSection(section)}
                >
                  <div className="flex items-center gap-2">
                    {sectionExpanded
                      ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                      : <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />}
                    <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{section}</span>
                    <Badge variant="neutral" size="sm">{pages.length} pages</Badge>
                    {sOn > 0 && <Badge variant="info" size="sm">{sOn} on</Badge>}
                  </div>
                  <label
                    className="flex items-center gap-1.5 text-xs cursor-pointer"
                    style={{ color: 'var(--muted-foreground)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: '#3B82F6' }}
                      checked={sAll}
                      ref={(el) => { if (el) el.indeterminate = sPartial; }}
                      onChange={(e) => toggleAll(allPerms, e.target.checked)}
                    />
                    Select all
                  </label>
                </div>

                {sectionExpanded && (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {pages.map(({ page, perms }) => {
                      const pageKey = `${section}:${page}`;
                      const pageExpanded = expandedPages.has(pageKey);
                      const { checked: pAll, indeterminate: pPartial } = checkState(perms);
                      const pOn = perms.filter((p) => selectedIds.has(p.id)).length;

                      return (
                        <div key={pageKey}>
                          {/* Page row */}
                          <div
                            className="flex items-center justify-between pl-8 pr-4 py-2 cursor-pointer select-none"
                            style={{ backgroundColor: 'var(--card)' }}
                            onClick={() => togglePage(pageKey)}
                          >
                            <div className="flex items-center gap-2">
                              {pageExpanded
                                ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                                : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />}
                              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{page}</span>
                              <Badge variant="neutral" size="sm">{perms.length}</Badge>
                              {pOn > 0 && <Badge variant="info" size="sm">{pOn} on</Badge>}
                            </div>
                            <label
                              className="flex items-center gap-1.5 text-xs cursor-pointer"
                              style={{ color: 'var(--muted-foreground)' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 cursor-pointer"
                                style={{ accentColor: '#3B82F6' }}
                                checked={pAll}
                                ref={(el) => { if (el) el.indeterminate = pPartial; }}
                                onChange={(e) => toggleAll(perms, e.target.checked)}
                              />
                              All
                            </label>
                          </div>

                          {/* Permission rows */}
                          {pageExpanded && (
                            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                              {perms.map((perm) => (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-3 pl-12 pr-4 py-2 cursor-pointer"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                                    style={{ accentColor: '#3B82F6' }}
                                    checked={selectedIds.has(perm.id)}
                                    onChange={(e) => onToggle(perm.id, e.target.checked)}
                                  />
                                  <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                      {perm.name}
                                    </span>
                                    <span className="block font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                      {perm.code}
                                    </span>
                                  </span>
                                  {perm.description && perm.description !== perm.name && (
                                    <span className="text-xs hidden sm:block flex-shrink-0" style={{ color: 'var(--muted-foreground)', maxWidth: '220px' }}>
                                      {perm.description}
                                    </span>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
      <Shield className="w-16 h-16 mb-4" style={{ color: 'var(--muted-foreground)', opacity: 0.3 }} />
      <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
        Select a role to configure its permissions.
      </p>
    </div>
  );
}

function filterSections(sections: SectionDef[], query: string): SectionDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;
  return sections
    .map((section) => {
      const sectionMatches = section.name.toLowerCase().includes(q);
      const filteredSubs = section.subsections.filter((sub) => {
        if (sectionMatches) return true;
        if (sub.name.toLowerCase().includes(q)) return true;
        if (sub.href?.toLowerCase().includes(q)) return true;
        for (const code of Object.values(sub.actions)) {
          if (code?.toLowerCase().includes(q)) return true;
        }
        return false;
      });
      if (filteredSubs.length === 0 && !sectionMatches) return null;
      return { ...section, subsections: sectionMatches ? section.subsections : filteredSubs };
    })
    .filter((s): s is SectionDef => s !== null);
}
