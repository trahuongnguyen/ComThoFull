import React from 'react';
import { Users } from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useOrder } from '@/contexts/OrderContext';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TableGridProps {
  onTableSelect: (tableId: number) => void;
}

export function TableGrid({ onTableSelect }: TableGridProps) {
  const { tables, updateTableStatus, floors } = useRestaurant();
  const { setActiveTableId, activeTableId, getTableOrders } = useOrder();

  const handleTableClick = (tableId: number, tableName: string) => {
    setActiveTableId(tableId);
    onTableSelect(tableId);
  };

  const getTableStatus = (tableId: number) => {
    const tableOrders = getTableOrders(tableId);
    const table = tables.find(t => t.id === tableId);
    
    // Check if any order is paid
    if (tableOrders.some(o => o.status === 'paid')) return 'paid';
    
    // Check if table has pending orders or is in ORDERING status
    if (tableOrders.length > 0 || table?.status === 'ORDERING') return 'ordering';
    
    return 'empty';
  };

  if (floors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No floors available
      </div>
    );
  }

  return (
    <Tabs defaultValue={floors[0]?.id?.toString() || '0'} className="w-full">
      <TabsList className="mb-4 w-full">
        {floors.map((floor) => (
          <TabsTrigger key={floor.id} value={floor.id?.toString() || '0'} className="flex-1">
            {floor.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {floors.map((floor) => {
        const floorTables = tables.filter(t => t.floorId === floor.id);
        return (
          <TabsContent key={floor.id} value={floor.id?.toString() || '0'}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {floorTables.map((table) => {
                const status = getTableStatus(table.id);
                const isActive = activeTableId === table.id;

                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table.id, table.name)}
                    className={cn(
                      'relative p-6 rounded-2xl border-2 transition-all duration-200 text-left group',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      status === 'empty' && 'bg-muted/30 border-muted-foreground/20 hover:border-muted-foreground/40',
                      status === 'ordering' && 'bg-info/10 border-info hover:border-info/80',
                      status === 'paid' && 'bg-success/10 border-success hover:border-success/80',
                      isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    {/* Status Indicator */}
                    <div className={cn(
                      'absolute top-3 right-3 w-3 h-3 rounded-full',
                      status === 'empty' && 'bg-muted-foreground/40',
                      status === 'ordering' && 'bg-info animate-pulse',
                      status === 'paid' && 'bg-success'
                    )} />

                    {/* Table Name */}
                    <h3 className={cn(
                      'text-lg font-bold mb-2',
                      status === 'empty' && 'text-muted-foreground',
                      status === 'ordering' && 'text-info',
                      status === 'paid' && 'text-success'
                    )}>
                      {table.name}
                    </h3>

                    {/* Capacity */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{table.capacity} seats</span>
                    </div>

                    {/* Order Info */}
                    {(() => {
                      const tableOrders = getTableOrders(table.id);
                      const totalItems = tableOrders.reduce((sum, o) => sum + o.items.length, 0);
                      const totalAmount = tableOrders.reduce((sum, o) => sum + o.total, 0);
                      
                      if (totalItems > 0) {
                        return (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm font-medium text-foreground">
                              {totalItems} items ({tableOrders.length} order{tableOrders.length > 1 ? 's' : ''})
                            </p>
                            <p className="text-sm text-primary font-bold">
                              {totalAmount.toLocaleString('vi-VN')} VND
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </button>
                );
              })}
              {floorTables.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No tables in this floor
                </div>
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
