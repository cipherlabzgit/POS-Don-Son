'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Calculator, Plus, Search, Edit, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { roundingRulesApi, type RoundingRule, type UpdateRoundingRuleDto } from '@/lib/api/rounding-rules';
import toast from 'react-hot-toast';

export default function RoundingRulesPage() {
  const router = useRouter();
  const [roundingRules, setRoundingRules] = useState<RoundingRule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoundingRules();
  }, [currentPage, pageSize, searchTerm]);

  const loadRoundingRules = async () => {
    try {
      setLoading(true);
      const response = await roundingRulesApi.getAll(currentPage, pageSize, searchTerm, undefined, undefined);
      setRoundingRules(response.roundingRules);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load rounding rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rule: RoundingRule) => {
    try {
      const updateData: UpdateRoundingRuleDto = {
        code: rule.code,
        name: rule.name,
        description: rule.description,
        appliesTo: rule.appliesTo,
        roundingMethod: rule.roundingMethod,
        decimalPlaces: rule.decimalPlaces,
        roundingIncrement: rule.roundingIncrement,
        minValue: rule.minValue,
        maxValue: rule.maxValue,
        ratioBaseQuantity: rule.ratioBaseQuantity,
        ratioYieldQuantity: rule.ratioYieldQuantity,
        sortOrder: rule.sortOrder,
        isDefault: rule.isDefault,
        isActive: !rule.isActive,
      };
      await roundingRulesApi.update(rule.id, updateData);
      toast.success(`Rounding rule ${rule.isActive ? 'deactivated' : 'activated'}`);
      loadRoundingRules();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update rounding rule');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: RoundingRule) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Rule Name',
      render: (item: RoundingRule) => (
        <div>
          <span className="font-medium">{item.name}</span>
          {item.description && (
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'appliesTo',
      label: 'Applies To',
      render: (item: RoundingRule) => (
        <Badge variant="neutral" size="sm">{item.appliesTo}</Badge>
      ),
    },
    {
      key: 'roundingMethod',
      label: 'Method',
      render: (item: RoundingRule) => (
        <span className="text-sm">{item.roundingMethod}</span>
      ),
    },
    {
      key: 'itemRatio',
      label: 'Item ratio',
      render: (item: RoundingRule) =>
        item.ratioBaseQuantity != null &&
        item.ratioBaseQuantity > 0 &&
        item.ratioYieldQuantity != null &&
        item.ratioYieldQuantity >= 0 ? (
          <span className="text-sm font-mono" title="Primary units → dependent units">
            {item.ratioBaseQuantity}→{item.ratioYieldQuantity}
          </span>
        ) : (
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            —
          </span>
        ),
    },
    {
      key: 'increment',
      label: 'Increment',
      render: (item: RoundingRule) => (
        <span className="text-sm font-mono">{item.roundingIncrement}</span>
      ),
    },
    {
      key: 'isDefault',
      label: 'Default',
      render: (item: RoundingRule) => (
        item.isDefault ? <Badge variant="info" size="sm">Default</Badge> : null
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: RoundingRule) => (
        item.isActive ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="danger" size="sm">Inactive</Badge>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: RoundingRule) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(`/administrator/rounding-rules/edit/${item.id}`)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: item.isActive ? '#DC2626' : '#10B981' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.isActive ? '#FEF2F2' : '#F0FDF4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            <Calculator className="w-8 h-8 inline-block mr-3" style={{ color: '#C8102E' }} />
            Rounding Rules
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage rounding rules for prices and quantities ({totalCount} rules)
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push('/administrator/rounding-rules/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rounding Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Rounding Rules List</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search rounding rules..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--input)' }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
            </div>
          ) : (
            <DataTable
              data={roundingRules}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
