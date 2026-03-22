import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Shield, ShieldCheck } from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Staff, UserRole } from '@/types';

export default function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff } = useRestaurant();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'USER' as UserRole,
    canOrder: true,
    canPayment: true,
  });

  const resetForm = () => {
    setFormData({
      username: '',
      fullName: '',
      password: '',
      role: 'USER',
      canOrder: true,
      canPayment: true,
    });
  };

  const handleAdd = () => {
    if (!formData.username || !formData.fullName || !formData.password) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng điền đầy đủ các trường bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    addStaff({
      username: formData.username,
      fullName: formData.fullName,
      role: formData.role,
      permissions: {
        canOrder: formData.canOrder,
        canPayment: formData.canPayment,
      },
    });

    toast({
      title: 'Đã thêm nhân viên',
      description: `${formData.fullName} đã được thêm thành công`,
    });

    resetForm();
    setShowAddDialog(false);
  };

  const handleEdit = () => {
    if (!editingStaff || !formData.fullName) return;

    updateStaff(editingStaff.id, {
      fullName: formData.fullName,
      role: formData.role,
      permissions: {
        canOrder: formData.canOrder,
        canPayment: formData.canPayment,
      },
    });

    toast({
      title: 'Đã cập nhật nhân viên',
      description: `${formData.fullName} đã được cập nhật thành công`,
    });

    setEditingStaff(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!deletingStaff) return;

    deleteStaff(deletingStaff.id);
    toast({
      title: 'Đã xóa nhân viên',
      description: `${deletingStaff.fullName} đã được xóa`,
    });
    setDeletingStaff(null);
  };

  const openEditDialog = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      username: staffMember.username,
      fullName: staffMember.fullName,
      password: '',
      role: staffMember.role,
      canOrder: staffMember.permissions.canOrder,
      canPayment: staffMember.permissions.canPayment,
    });
  };

  return (
    <div className="p-6 overflow-auto h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
            <p className="text-muted-foreground">Quản lý tài khoản và quyền của nhân viên</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gradient-primary text-primary-foreground shadow-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>

        {/* Staff List */}
        <div className="grid gap-4">
          {staff.map((member) => (
            <div
              key={'Staff-' + member.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    member.role === 'ADMIN' ? 'bg-primary/20' : 'bg-info/20'
                  )}>
                    {member.role === 'ADMIN' ? (
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    ) : (
                      <Users className="w-6 h-6 text-info" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{member.fullName}</h3>
                    <p className="text-sm text-muted-foreground">@{member.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Permissions */}
                  <div className="flex gap-2">
                    {member.permissions?.canOrder && (
                      <span className="px-2 py-1 text-xs bg-success/10 text-success rounded-full">
                        Có thể đặt hàng
                      </span>
                    )}
                    {member.permissions?.canPayment && (
                      <span className="px-2 py-1 text-xs bg-info/10 text-info rounded-full">
                        Có thể thanh toán
                      </span>
                    )}
                  </div>

                  {/* Role Badge */}
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    member.role === 'ADMIN' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-secondary text-muted-foreground'
                  )}>
                    {member.role}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(member)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeletingStaff(member)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm nhân viên mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên đăng nhập</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Nhân viên</SelectItem>
                    <SelectItem value="ADMIN">Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <Label>Quyền</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Có thể nhận đơn hàng</span>
                  <Switch
                    checked={formData.canOrder}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, canOrder: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Có thể xử lý thanh toán</span>
                  <Switch
                    checked={formData.canPayment}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, canPayment: v }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Hủy</Button>
              <Button onClick={handleAdd} className="gradient-primary text-primary-foreground">Thêm nhân viên</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên đăng nhập</Label>
                <Input
                  value={formData.username}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Nhân viên</SelectItem>
                    <SelectItem value="ADMIN">Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <Label>Quyền</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Có thể nhận đơn hàng</span>
                  <Switch
                    checked={formData.canOrder}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, canOrder: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Có thể xử lý thanh toán</span>
                  <Switch
                    checked={formData.canPayment}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, canPayment: v }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStaff(null)}>Hủy</Button>
              <Button onClick={handleEdit} className="gradient-primary text-primary-foreground">Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingStaff} onOpenChange={() => setDeletingStaff(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa nhân viên</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa {deletingStaff?.fullName}? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
