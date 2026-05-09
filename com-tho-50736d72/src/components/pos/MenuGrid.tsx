import React, { useState } from 'react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useOrder } from '@/contexts/OrderContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FoodItem } from '@/types';

export function MenuGrid() {
  const { categories, foodItems } = useRestaurant();
  const { activeTableId, addItemToOrder, getTableOrders } = useOrder();
  const { tables, updateTableStatus } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id);
  const { toast } = useToast();

  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>(foodItems.filter(food => food.categoryId === selectedCategory));
  const activeTable = tables.find(t => t.id === activeTableId);

  const handleAddItem = (food: typeof foodItems[0]) => {
    if (!activeTableId || !activeTable) {
      toast({
        title: 'Chọn bàn trước',
        description: 'Vui lòng chọn bàn trước khi thêm món',
        variant: 'destructive',
      });
      return;
    }

    // Check if this is the first item being added to this table
    const tableOrders = getTableOrders(activeTableId);
    const totalItems = tableOrders.reduce((sum, order) => sum + order.items.length, 0);
    const isFirstItem = totalItems === 0;

    addItemToOrder(activeTableId, activeTable.name, {
      foodId: food.id,
      foodName: food.name,
      quantity: 1,
      unitPrice: food.price,
      toppings: [],
      isUpsized: false,
      upSizePrice: food.upSizePrice,
    });

    // Change table status to ORDERING when first item is added
    if (isFirstItem && activeTable.status === 'AVAILABLE') {
      updateTableStatus(activeTableId, 'ORDERING');
    }

    toast({
      title: 'Đã thêm món',
      description: `${food.name} đã được thêm vào ${activeTable.name}`,
    });
  };

  const handleChangeSelectedCategory = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setFilteredFoods(foodItems.filter(food => food.categoryId === categoryId));
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {handleChangeSelectedCategory(category.id)}}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              selectedCategory === category.id
                ? 'gradient-primary text-primary-foreground shadow-button'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <span className="text-lg"></span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Active Table Indicator */}
      {activeTable ? (
        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-primary font-medium">
            Đang thêm vào: <span className="font-bold">{activeTable.name}</span>
          </p>
        </div>
      ) : (
        <div className="px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-sm text-warning font-medium">
            Chọn bàn để bắt đầu thêm món
          </p>
        </div>
      )}

      {/* Food Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFoods.map((food) => (
          <button
            key={food.id}
            onClick={() => handleAddItem(food)}
            disabled={!activeTableId}
            className={cn(
              'p-4 rounded-2xl border border-border bg-card transition-all duration-200 text-left',
              'hover:border-primary hover:shadow-glow hover:scale-[1.02]',
              'active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-border disabled:hover:shadow-none'
            )}
          >
            {/* Food Image Placeholder */}
            <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
              <span className="text-4xl opacity-60">🍽️</span>
            </div>

            <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
              {food.name}
            </h4>

            <p className="text-primary font-bold">
              {food.price.toLocaleString('vi-VN')}đ
            </p>

            {food.canUpSize && (
              <p className="text-xs text-muted-foreground mt-1">
                +{food.upSizePrice?.toLocaleString('vi-VN')}đ để tăng size
              </p>
            )}
          </button>
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Không có món trong danh mục này
        </div>
      )}
    </div>
  );
}
