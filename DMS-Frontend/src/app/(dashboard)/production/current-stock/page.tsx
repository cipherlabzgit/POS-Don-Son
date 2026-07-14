'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Search, RefreshCw } from 'lucide-react';
import { currentStockApi, type CurrentStock } from '@/lib/api/current-stock';
import { ProtectedPage } from '@/components/auth';
import toast from 'react-hot-toast';

export default function CurrentStockPage() {
  return (
    <ProtectedPage permission="production:current-stock:view">
      <CurrentStockPageContent />
    </ProtectedPage>
  );
}

function CurrentStockPageContent() {
  const [stocks, setStocks] = useState<CurrentStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await currentStockApi.getAll();
      setStocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load current stock:', error);
      toast.error('Failed to load current stock');
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Stock data refreshed');
  };

  const filteredStocks = Array.isArray(stocks) ? stocks.filter(s => {
    const matchesSearch = searchTerm === '' || 
      s.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const totalPages = Math.ceil(filteredStocks.length / pageSize);
  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDateTime = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${month}/${day}/${year} ${displayHours}:${minutes}:${seconds} ${ampm}`;
  };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--foreground)' }}>
          {item.productCode} - {item.productName}
        </span>
      ),
    },
    {
      key: 'openBalance',
      label: 'Open Balance',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.openBalance ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'todayProduction',
      label: 'Today Production',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.todayProduction ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'todayProductionCancelled',
      label: 'Production Cancelled',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.todayProductionCancelled ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'todayDelivery',
      label: 'Today Delivery',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.todayDelivery ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'deliveryCancelled',
      label: 'Delivery Cancelled',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.deliveryCancelled ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'deliveryReturned',
      label: 'Delivery Returned',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.deliveryReturned ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'stockAdjustment',
      label: 'Stock Adjustment',
      render: (item: CurrentStock) => (
        <span style={{ color: 'var(--muted-foreground)' }}>
          {(item.stockAdjustment ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'todayBalance',
      label: 'Today Balance',
      render: (item: CurrentStock) => (
        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
          {(item.todayBalance ?? 0).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Current Stock</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Production Stock as of {formatDateTime(currentTime)}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {isLoading ? 'Loading...' : `Showing ${filteredStocks.length} products`}
              </span>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                autoComplete="off"
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm"
                style={{ 
                  border: '1px solid var(--input)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <DataTable
              data={paginatedStocks}
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
