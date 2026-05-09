import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Grid3X3, Utensils, Tag, Pizza, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, Category, FoodItem, Topping } from '@/types';

export default function RestaurantPage() {
  const {
    tables, categories, foodItems, toppings, floors,
    addTable, updateTable, deleteTable,
    addCategory, updateCategory, deleteCategory,
    addFoodItem, updateFoodItem, deleteFoodItem,
    addTopping, updateTopping, deleteTopping,
  } = useRestaurant();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('tables');
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; item: any } | null>(null);
  
  // Sort states
  const [tableSort, setTableSort] = useState<{ field: 'name' | 'capacity' | 'floorId'; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
  const [categorySort, setCategorySort] = useState<{ field: 'name'; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
  const [foodSort, setFoodSort] = useState<{ field: 'name' | 'price' | 'categoryId'; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
  const [toppingSort, setToppingSort] = useState<{ field: 'name' | 'price'; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });

  // Table state
  const [tableDialog, setTableDialog] = useState<{ open: boolean; editing?: Table }>({ open: false });
  const [tableForm, setTableForm] = useState({ name: '', floorId: 0, capacity: 0 });

  // Category state
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; editing?: Category }>({ open: false });
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  // Food state
  const [foodDialog, setFoodDialog] = useState<{ open: boolean; editing?: FoodItem }>({ open: false });
  const [foodForm, setFoodForm] = useState({ name: '', price: '', categoryId: 0, hasUpsize: false, upSizePrice: '' });

  // Topping state
  const [toppingDialog, setToppingDialog] = useState<{ open: boolean; editing?: Topping }>({ open: false });
  const [toppingForm, setToppingForm] = useState({ name: '', price: '' });

  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

  // Sorted data
  const sortedTables = useMemo(() => {
    const sorted = [...tables];
    sorted.sort((a, b) => {
      let aVal: any = a[tableSort.field];
      let bVal: any = b[tableSort.field];
      if (tableSort.field === 'floorId') {
        const aFloor = floors.find(f => f.id === a.floorId)?.name || '';
        const bFloor = floors.find(f => f.id === b.floorId)?.name || '';
        aVal = aFloor;
        bVal = bFloor;
      }
      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (typeof aVal === 'string') {
        return tableSort.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      // Handle numeric values with null/undefined
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return tableSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [tables, tableSort, floors]);

  const sortedCategories = useMemo(() => {
    const sorted = [...categories];
    sorted.sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return categorySort.direction === 'asc'
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    });
    return sorted;
  }, [categories, categorySort]);

  const sortedFoodItems = useMemo(() => {
    const sorted = [...foodItems];
    sorted.sort((a, b) => {
      let aVal: any = a[foodSort.field];
      let bVal: any = b[foodSort.field];
      if (foodSort.field === 'categoryId') {
        const aCat = categories.find(c => c.id === a.categoryId)?.name || '';
        const bCat = categories.find(c => c.id === b.categoryId)?.name || '';
        aVal = aCat;
        bVal = bCat;
      }
      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (typeof aVal === 'string') {
        return foodSort.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      // Handle numeric values with null/undefined
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return foodSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [foodItems, foodSort, categories]);

  const sortedToppings = useMemo(() => {
    const sorted = [...toppings];
    sorted.sort((a, b) => {
      let aVal: any = a[toppingSort.field];
      let bVal: any = b[toppingSort.field];
      // Handle null/undefined values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (typeof aVal === 'string') {
        return toppingSort.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      // Handle numeric values with null/undefined
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return toppingSort.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [toppings, toppingSort]);

  const handleSort = (type: 'table' | 'category' | 'food' | 'topping', field: string) => {
    if (type === 'table') {
      setTableSort(prev => ({
        field: field as 'name' | 'capacity' | 'floorId',
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else if (type === 'category') {
      setCategorySort(prev => ({
        field: 'name',
        direction: prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else if (type === 'food') {
      setFoodSort(prev => ({
        field: field as 'name' | 'price' | 'categoryId',
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else if (type === 'topping') {
      setToppingSort(prev => ({
        field: field as 'name' | 'price',
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    }
  };

  const SortButton = ({ type, field, label }: { type: 'table' | 'category' | 'food' | 'topping'; field: string; label: string }) => {
    let currentSort: any;
    if (type === 'table') currentSort = tableSort;
    else if (type === 'category') currentSort = categorySort;
    else if (type === 'food') currentSort = foodSort;
    else currentSort = toppingSort;

    const isActive = currentSort.field === field;
    const direction = isActive ? currentSort.direction : undefined;

    return (
      <button
        onClick={() => handleSort(type, field)}
        className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors"
      >
        {label}
        {direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : direction === 'desc' ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3" />
        )}
      </button>
    );
  };

  // Table handlers
  const handleTableSave = () => {
    if (!tableForm.name) {
      toast({ title: 'Vui lòng nhập tên bàn', variant: 'destructive' });
      return;
    }
    if (tableDialog.editing) {
      updateTable(tableDialog.editing.id, { name: tableForm.name, floorId: tableForm.floorId, capacity: tableForm.capacity });
      toast({ title: 'Đã cập nhật bàn' });
    } else {
      addTable({ name: tableForm.name, floorId: tableForm.floorId, capacity: tableForm.capacity });
      toast({ title: 'Đã thêm bàn' });
    }
    setTableDialog({ open: false });
    setTableForm({ name: '', floorId: 0, capacity: 0 });
  };

  // Category handlers
  const handleCategorySave = () => {
    if (!categoryForm.name) {
      toast({ title: 'Vui lòng nhập tên danh mục', variant: 'destructive' });
      return;
    }
    if (categoryDialog.editing) {
      updateCategory(categoryDialog.editing.id, { name: categoryForm.name });
      toast({ title: 'Đã cập nhật danh mục' });
    } else {
      addCategory({ name: categoryForm.name });
      toast({ title: 'Đã thêm danh mục' });
    }
    setCategoryDialog({ open: false });
    setCategoryForm({ name: '' });
  };

  // Food handlers
  const handleFoodSave = () => {
    if (!foodForm.name || !foodForm.price || !foodForm.categoryId) {
      toast({ title: 'Vui lòng điền đầy đủ các trường bắt buộc', variant: 'destructive' });
      return;
    }
    const data = {
      name: foodForm.name,
      price: parseInt(foodForm.price),
      categoryId: foodForm.categoryId,
      canUpSize: foodForm.hasUpsize,
      upSizePrice: foodForm.upSizePrice ? parseInt(foodForm.upSizePrice) : undefined,
    };
    if (foodDialog.editing) {
      updateFoodItem(foodDialog.editing.id, data);
      toast({ title: 'Đã cập nhật món ăn' });
    } else {
      addFoodItem(data);
      toast({ title: 'Đã thêm món ăn' });
    }
    setFoodDialog({ open: false });
    setFoodForm({ name: '', price: '', categoryId: 0, hasUpsize: false, upSizePrice: '' });
  };

  // Topping handlers
  const handleToppingSave = () => {
    if (!toppingForm.name || !toppingForm.price) {
      toast({ title: 'Vui lòng điền đầy đủ các trường', variant: 'destructive' });
      return;
    }
    if (toppingDialog.editing) {
      updateTopping(toppingDialog.editing.id, { name: toppingForm.name, price: parseInt(toppingForm.price) });
      toast({ title: 'Đã cập nhật topping' });
    } else {
      addTopping({ name: toppingForm.name, price: parseInt(toppingForm.price) });
      toast({ title: 'Đã thêm topping' });
    }
    setToppingDialog({ open: false });
    setToppingForm({ name: '', price: '' });
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    const typeNames: Record<string, string> = {
      'table': 'Bàn',
      'category': 'Danh mục',
      'food': 'Món ăn',
      'topping': 'Topping'
    };
    switch (deleteDialog.type) {
      case 'table': deleteTable(deleteDialog.item.id); break;
      case 'category': deleteCategory(deleteDialog.item.id); break;
      case 'food': deleteFoodItem(deleteDialog.item.id); break;
      case 'topping': deleteTopping(deleteDialog.item.id); break;
    }
    toast({ title: `Đã xóa ${typeNames[deleteDialog.type] || deleteDialog.type}` });
    setDeleteDialog(null);
  };

  return (
    <div className="p-6 overflow-auto h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý nhà hàng</h1>
          <p className="text-muted-foreground">Quản lý bàn, thực đơn và topping</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-secondary p-1 w-full sm:w-auto">
            <TabsTrigger value="tables" className="h-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Bàn
            </TabsTrigger>
            <TabsTrigger value="categories" className="h-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Tag className="w-4 h-4 mr-2" />
              Danh mục
            </TabsTrigger>
            <TabsTrigger value="foods" className="h-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Utensils className="w-4 h-4 mr-2" />
              Món ăn
            </TabsTrigger>
            <TabsTrigger value="toppings" className="h-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Pizza className="w-4 h-4 mr-2" />
              Topping
            </TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setTableDialog({ open: true }); setTableForm({ name: '', floorId: 0, capacity: 0 }); }} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />Thêm bàn
              </Button>
            </div>
            <Tabs defaultValue={floors[0]?.id?.toString() || '0'} className="w-full">
              <TabsList className="mb-4">
                {floors.map((floor) => (
                  <TabsTrigger key={floor.id} value={floor.id?.toString() || '0'}>
                    {floor.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {floors.map((floor) => {
                const floorTables = sortedTables.filter(t => t.floorId === floor.id);
                return (
                  <TabsContent key={floor.id} value={floor.id?.toString() || '0'}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        <SortButton type="table" field="name" label="Sắp xếp theo tên" />
                        <SortButton type="table" field="capacity" label="Sắp xếp theo sức chứa" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {floorTables.map((table) => (
                        <div key={table.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{table.name}</h3>
                            <p className="text-sm text-muted-foreground">{table.capacity} chỗ</p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => { setTableDialog({ open: true, editing: table }); setTableForm({ name: table.name, floorId: table.floorId, capacity: table.capacity }); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialog({ type: 'table', item: table })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {floorTables.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          No tables in this floor
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <SortButton type="category" field="name" label="Sort by Name" />
              <Button onClick={() => { setCategoryDialog({ open: true }); setCategoryForm({ name: '' }); }} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />Add Category
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedCategories.map((cat) => (
                <div key={cat.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🍽️</span>
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => { setCategoryDialog({ open: true, editing: cat }); setCategoryForm({ name: cat.name }); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialog({ type: 'category', item: cat })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Foods Tab */}
          <TabsContent value="foods" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setFoodDialog({ open: true }); setFoodForm({ name: '', price: '', categoryId: categories[0]?.id || 0, hasUpsize: false, upSizePrice: '' }); }} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />Add Food
              </Button>
            </div>
            <Tabs defaultValue={categories[0]?.id?.toString() || '0'} className="w-full">
              <TabsList className="mb-4">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id?.toString() || '0'}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map((category) => {
                const categoryFoods = sortedFoodItems.filter(f => f.categoryId === category.id);
                return (
                  <TabsContent key={category.id} value={category.id?.toString() || '0'}>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                              <SortButton type="food" field="name" label="Name" />
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase">
                              <SortButton type="food" field="price" label="Price" />
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase">Upsize</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {categoryFoods.map((food) => {
                            return (
                              <tr key={food.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 font-medium text-foreground">{food.name}</td>
                                <td className="px-6 py-4 text-right text-primary font-semibold">{formatCurrency(food.price)}</td>
                                <td className="px-6 py-4 text-center">
                                  {food.canUpSize ? <span className="text-success">+{formatCurrency(food.upSizePrice || 0)}</span> : <span className="text-muted-foreground">-</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setFoodDialog({ open: true, editing: food }); setFoodForm({ name: food.name, price: String(food.price), categoryId: food.categoryId, hasUpsize: food.canUpSize || false, upSizePrice: String(food.upSizePrice || '') }); }}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialog({ type: 'food', item: food })}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {categoryFoods.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                No items in this category
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>

          {/* Toppings Tab */}
          <TabsContent value="toppings" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <SortButton type="topping" field="name" label="Sort by Name" />
                <SortButton type="topping" field="price" label="Sort by Price" />
              </div>
              <Button onClick={() => { setToppingDialog({ open: true }); setToppingForm({ name: '', price: '' }); }} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />Add Topping
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedToppings.map((topping) => (
                <div key={topping.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{topping.name}</h3>
                    <p className="text-primary font-bold">+{formatCurrency(topping.price)}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => { setToppingDialog({ open: true, editing: topping }); setToppingForm({ name: topping.name, price: String(topping.price) }); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteDialog({ type: 'topping', item: topping })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Table Dialog */}
        <Dialog open={tableDialog.open} onOpenChange={(open) => setTableDialog({ open })}>
          <DialogContent>
            <DialogHeader><DialogTitle>{tableDialog.editing ? 'Edit Table' : 'Add Table'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input value={tableForm.name} onChange={(e) => setTableForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary" placeholder="e.g., Table 1, VIP Room" />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Select value={tableForm.floorId.toString()} onValueChange={(v) => setTableForm(p => ({ ...p, floorId: parseInt(v) }))}>
                  <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {floors.map((flo) => (
                      <SelectItem key={flo.id} value={flo.id.toString()}>{flo.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={tableForm.capacity} onChange={(e) => setTableForm(p => ({ ...p, capacity: parseInt(e.target.value) }))} className="bg-secondary" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTableDialog({ open: false })}>Cancel</Button>
              <Button onClick={handleTableSave} className="gradient-primary text-primary-foreground">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ open })}>
          <DialogContent>
            <DialogHeader><DialogTitle>{categoryDialog.editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={categoryForm.name} onChange={(e) => setCategoryForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary" />
              </div>
              {/* <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Input value={categoryForm.icon} onChange={(e) => setCategoryForm(p => ({ ...p, icon: e.target.value }))} className="bg-secondary" maxLength={2} />
              </div> */}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialog({ open: false })}>Cancel</Button>
              <Button onClick={handleCategorySave} className="gradient-primary text-primary-foreground">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Food Dialog */}
        <Dialog open={foodDialog.open} onOpenChange={(open) => setFoodDialog({ open })}>
          <DialogContent>
            <DialogHeader><DialogTitle>{foodDialog.editing ? 'Edit Food Item' : 'Add Food Item'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={foodForm.name} onChange={(e) => setFoodForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label>Price (VND)</Label>
                <Input type="number" value={foodForm.price} onChange={(e) => setFoodForm(p => ({ ...p, price: e.target.value }))} className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={foodForm.categoryId.toString()} onValueChange={(v) => setFoodForm(p => ({ ...p, categoryId: parseInt(v) }))}>
                  <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>🍽️ {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Label>Has Upsize Option</Label>
                <Switch checked={foodForm.hasUpsize} onCheckedChange={(v) => setFoodForm(p => ({ ...p, hasUpsize: v }))} />
              </div>
              {foodForm.hasUpsize && (
                <div className="space-y-2">
                  <Label>Upsize Price (VND)</Label>
                  <Input type="number" value={foodForm.upSizePrice} onChange={(e) => setFoodForm(p => ({ ...p, upSizePrice: e.target.value }))} className="bg-secondary" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFoodDialog({ open: false })}>Cancel</Button>
              <Button onClick={handleFoodSave} className="gradient-primary text-primary-foreground">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Topping Dialog */}
        <Dialog open={toppingDialog.open} onOpenChange={(open) => setToppingDialog({ open })}>
          <DialogContent>
            <DialogHeader><DialogTitle>{toppingDialog.editing ? 'Edit Topping' : 'Add Topping'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={toppingForm.name} onChange={(e) => setToppingForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label>Price (VND)</Label>
                <Input type="number" value={toppingForm.price} onChange={(e) => setToppingForm(p => ({ ...p, price: e.target.value }))} className="bg-secondary" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setToppingDialog({ open: false })}>Cancel</Button>
              <Button onClick={handleToppingSave} className="gradient-primary text-primary-foreground">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa {deleteDialog?.type === 'table' ? 'bàn' : deleteDialog?.type === 'category' ? 'danh mục' : deleteDialog?.type === 'food' ? 'món ăn' : 'topping'} này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
