import React, { useState } from 'react';
import axios from 'axios';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Plus, Target, Edit2, Trash2, Calendar } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GoalsManager = ({ goals, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    target_date: ''
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_amount: '',
      target_date: ''
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date || null
      };

      if (editingGoal) {
        await axios.put(`${API}/goals/${editingGoal.id}`, payload);
      } else {
        await axios.post(`${API}/goals`, payload);
      }

      onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date || ''
    });
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await axios.delete(`${API}/goals/${goalId}`);
        onRefresh();
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getGoalStatus = (goal) => {
    const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
    const today = new Date();
    const targetDate = goal.target_date ? new Date(goal.target_date) : null;
    const isOverdue = targetDate && targetDate < today && progress < 100;

    if (progress >= 100) return { status: 'completed', color: 'bg-emerald-500', text: 'Concluída' };
    if (isOverdue) return { status: 'overdue', color: 'bg-red-500', text: 'Atrasada' };
    if (progress >= 75) return { status: 'near', color: 'bg-yellow-500', text: 'Quase lá' };
    return { status: 'active', color: 'bg-blue-500', text: 'Em andamento' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Metas Financeiras</h2>
          <p className="text-slate-600">Configure e acompanhe seus objetivos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {showForm && (
        <Card className="finance-card">
          <CardHeader>
            <CardTitle>
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ex: Reserva de emergência, Viagem..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhes sobre sua meta..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Valor da Meta (R$)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Data Limite (opcional)</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Salvando...' : (editingGoal ? 'Atualizar' : 'Criar')}
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

      {goals.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
            const goalStatus = getGoalStatus(goal);

            return (
              <Card key={goal.id} className="finance-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
                        {goal.title}
                      </CardTitle>
                      <Badge className={`${goalStatus.color} text-white text-xs`}>
                        {goalStatus.text}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(goal.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goal.description && (
                    <p className="text-sm text-slate-600">{goal.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progresso</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(goal.current_amount)}
                      </span>
                      <span className="text-slate-600">
                        {formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Prazo: {formatDate(goal.target_date)}
                    </div>
                  )}

                  <div className="text-sm text-slate-500">
                    Faltam: {formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="finance-card">
          <CardContent className="text-center py-16">
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma meta criada</h3>
            <p className="text-slate-500 mb-6">
              Crie suas primeiras metas financeiras para começar a acompanhar seus objetivos.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalsManager;