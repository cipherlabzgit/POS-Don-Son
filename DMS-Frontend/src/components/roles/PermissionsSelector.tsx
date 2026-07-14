'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Shield, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Permission } from '@/lib/api/permissions';

interface PermissionsSelectorProps {
  permissions: Permission[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

interface GroupedPermission {
  module: string;
  permissions: Permission[];
}

export default function PermissionsSelector({
  permissions,
  selectedIds,
  onChange,
}: PermissionsSelectorProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);

    // Sort permissions within each module by displayOrder
    Object.keys(groups).forEach((module) => {
      groups[module].sort((a, b) => a.displayOrder - b.displayOrder);
    });

    // Convert to array and sort by module name
    return Object.entries(groups)
      .map(([module, perms]) => ({ module, permissions: perms }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }, [permissions]);

  // Filter by module and search term
  const filteredGroups = useMemo(() => {
    let filtered = groupedPermissions;

    // Filter by selected module
    if (selectedModule !== 'all') {
      filtered = filtered.filter((group) => group.module === selectedModule);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (perm) =>
            perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.code.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      })).filter((group) => group.permissions.length > 0);
    }

    return filtered;
  }, [groupedPermissions, selectedModule, searchTerm]);

  const totalPermissions = permissions.length;
  const selectedCount = selectedIds.length;

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const expandAll = () => {
    setExpandedModules(new Set(filteredGroups.map((g) => g.module)));
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  const isModuleSelected = (modulePerms: Permission[]) => {
    return modulePerms.every((perm) => selectedIds.includes(perm.id));
  };

  const isModulePartiallySelected = (modulePerms: Permission[]) => {
    const selectedInModule = modulePerms.filter((perm) => selectedIds.includes(perm.id));
    return selectedInModule.length > 0 && selectedInModule.length < modulePerms.length;
  };

  const toggleModulePermissions = (modulePerms: Permission[]) => {
    const moduleIds = modulePerms.map((p) => p.id);
    const allSelected = modulePerms.every((perm) => selectedIds.includes(perm.id));

    if (allSelected) {
      // Deselect all in module
      onChange(selectedIds.filter((id) => !moduleIds.includes(id)));
    } else {
      // Select all in module
      const newSelected = [...selectedIds];
      moduleIds.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      onChange(newSelected);
    }
  };

  const togglePermission = (permId: string) => {
    if (selectedIds.includes(permId)) {
      onChange(selectedIds.filter((id) => id !== permId));
    } else {
      onChange([...selectedIds, permId]);
    }
  };

  const selectAllPermissions = () => {
    onChange(permissions.map((p) => p.id));
  };

  const clearAllPermissions = () => {
    onChange([]);
  };

  // Extract operation name from permission name (e.g., "Create Ingredients" -> "Create")
  const getOperationFromName = (name: string): string => {
    const operations = ['Create', 'Update', 'Delete', 'View', 'Read', 'Manage', 'Execute', 'Approve', 'Cancel'];
    for (const op of operations) {
      if (name.startsWith(op)) return op;
    }
    return name.split(' ')[0] || name;
  };

  // Extract entity name from permission name (e.g., "Create Ingredients" -> "Ingredients")
  const getEntityFromName = (name: string): string => {
    const operation = getOperationFromName(name);
    return name.replace(operation, '').trim();
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between p-4 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>PERMISSIONS SELECTED</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {selectedCount} <span className="text-sm font-normal" style={{ color: 'var(--muted-foreground)' }}>/ {totalPermissions}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {((selectedCount / totalPermissions) * 100).toFixed(0)}% Complete
          </div>
          <div className="w-48 h-2 rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(selectedCount / totalPermissions) * 100}%`,
                backgroundColor: '#3B82F6',
              }}
            />
          </div>
        </div>
      </div>

      {/* Super Admin Quick Toggle */}
      <div
        className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all"
        style={{
          backgroundColor: selectedCount === totalPermissions ? '#FEF3C7' : 'var(--card)',
          borderColor: selectedCount === totalPermissions ? '#FCD34D' : 'var(--border)',
        }}
        onClick={() => {
          if (selectedCount === totalPermissions) {
            clearAllPermissions();
          } else {
            selectAllPermissions();
          }
        }}
      >
        <input
          type="checkbox"
          className="w-5 h-5 cursor-pointer"
          style={{ accentColor: '#C8102E' }}
          checked={selectedCount === totalPermissions}
          onChange={() => {}}
          onClick={(e) => e.stopPropagation()}
        />
        <div>
          <div
            className="font-semibold text-sm flex items-center gap-2"
            style={{ color: selectedCount === totalPermissions ? '#92400E' : 'var(--foreground)' }}
          >
            <Shield className="w-4 h-4" />
            Grant All Permissions (Super Admin)
          </div>
          <div
            className="text-xs"
            style={{ color: selectedCount === totalPermissions ? '#B45309' : 'var(--muted-foreground)' }}
          >
            Instantly grant all {totalPermissions} permissions to this role
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
            style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm"
          style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)' }}
        >
          <option value="all">All Modules</option>
          {groupedPermissions.map((group) => (
            <option key={group.module} value={group.module}>
              {group.module}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={expandAll}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
        >
          Expand All
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
        >
          Collapse All
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={clearAllPermissions}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
          >
            Clear All ({selectedCount})
          </button>
        )}
      </div>

      {/* Modules Grid */}
      <div className="space-y-2">
        {filteredGroups.map((group) => {
          const isExpanded = expandedModules.has(group.module);
          const isSelected = isModuleSelected(group.permissions);
          const isPartiallySelected = isModulePartiallySelected(group.permissions);
          const selectedInModule = group.permissions.filter((p) => selectedIds.includes(p.id)).length;

          return (
            <div
              key={group.module}
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: 'var(--border)' }}
            >
              {/* Module Header - Click to expand */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-opacity-50"
                style={{
                  backgroundColor: isExpanded ? '#F3F4F6' : 'var(--muted)',
                }}
                onClick={() => toggleModule(group.module)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" style={{ color: '#3B82F6' }} />
                  ) : (
                    <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                  )}
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {group.module}
                  </span>
                  <Badge variant="info" size="sm">
                    {selectedInModule} / {group.permissions.length}
                  </Badge>
                </div>

                {/* Select All checkbox */}
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isPartiallySelected;
                      }
                    }}
                    onChange={() => toggleModulePermissions(group.permissions)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#3B82F6' }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Select All
                  </span>
                </label>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 space-y-2" style={{ backgroundColor: 'var(--background)' }}>
                  {group.permissions.map((perm) => {
                    const operation = getOperationFromName(perm.name);
                    const entity = getEntityFromName(perm.name);
                    const isChecked = selectedIds.includes(perm.id);

                    return (
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="w-4 h-4 rounded mt-0.5"
                          style={{ accentColor: '#3B82F6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {operation}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {entity || perm.description}
                          </div>
                          <div className="text-xs mt-1 font-mono" style={{ color: '#9CA3AF' }}>
                            {perm.code}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
            <p className="text-sm">No permissions found</p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs mt-2 underline"
                style={{ color: '#3B82F6' }}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
