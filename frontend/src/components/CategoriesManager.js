import React, { useState } from 'react';
import axios from 'axios';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Plus, Edit2, Trash2, DollarSign } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoriesManager = ({ categories, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    limit_enabled: false,
    monthly_limit: '',
    color: '#3B82F6'
  });
  const [loading, setLoading] = useState(false);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      limit_enabled: false,
      monthly_limit: '',
      color: '#3B82F6'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        monthly_limit: formData.limit_enabled && formData.monthly_limit ? 
          parseFloat(formData.monthly_limit) : null
      };

      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, payload);
      } else {
        await axios.post(`${API}/categories`, payload);
      }

      onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      limit_enabled: category.limit_enabled,
      monthly_limit: category.monthly_limit || '',
      color: category.color
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await axios.delete(`${API}/categories/${categoryId}`);
        onRefresh();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciar Categorias</h2>
          <p className="text-slate-600">Configure categorias e limites de gastos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {showForm && (
        <Card className="finance-card">
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Alimentação, Transporte..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-slate-400' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              {formData.type === 'expense' && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="limit_enabled"
                      checked={formData.limit_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, limit_enabled: checked })}
                    />
                    <Label htmlFor="limit_enabled">Habilitar limite mensal</Label>
                  </div>

                  {formData.limit_enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="monthly_limit">Limite Mensal (R$)</Label>
                      <Input
                        id="monthly_limit"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.monthly_limit}
                        onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Salvando...' : (editingCategory ? 'Atualizar' : 'Criar')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense Categories */}
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              Categorias de Gastos
              <Badge variant="secondary">{expenseCategories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <div className="space-y-3">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="category-dot"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <span className="font-medium text-slate-900">{category.name}</span>
                        {category.limit_enabled && (
                          <div className="text-xs text-slate-500 flex items-center mt-1">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Limite: {formatCurrency(category.monthly_limit)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Nenhuma categoria de gastos criada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              Categorias de Receitas
              <Badge variant="secondary">{incomeCategories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeCategories.length > 0 ? (
              <div className="space-y-3">
                {incomeCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="category-dot"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium text-slate-900">{category.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Nenhuma categoria de receitas criada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoriesManager;