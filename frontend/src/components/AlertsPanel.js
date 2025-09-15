import React from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, CheckCircle, Bell, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertsPanel = ({ alerts, categories, onRefresh }) => {
  const markAsRead = async (alertId) => {
    try {
      await axios.put(`${API}/alerts/${alertId}/read`);
      onRefresh();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAlertIcon = (percentage) => {
    if (percentage >= 100) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (percentage >= 80) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <Bell className="w-5 h-5 text-blue-500" />;
  };

  const getAlertColor = (percentage) => {
    if (percentage >= 100) return 'border-red-200 bg-red-50';
    if (percentage >= 80) return 'border-yellow-200 bg-yellow-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoria desconhecida';
  };

  const unreadAlerts = alerts.filter(alert => !alert.is_read);
  const readAlerts = alerts.filter(alert => alert.is_read);

  if (alerts.length === 0) {
    return (
      <Card className="finance-card">
        <CardContent className="text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum alerta</h3>
          <p className="text-slate-500">
            Você está dentro dos limites! Todos os gastos estão sob controle.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Alertas e Notificações</h2>
          <p className="text-slate-600">Acompanhe os limites de gastos por categoria</p>
        </div>
        {unreadAlerts.length > 0 && (
          <Badge className="bg-red-500 text-white">
            {unreadAlerts.length} não lido{unreadAlerts.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Unread Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Alertas Não Lidos
          </h3>
          
          {unreadAlerts.map((alert) => (
            <Card key={alert.id} className={`finance-card border-2 ${getAlertColor(alert.percentage)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getAlertIcon(alert.percentage)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">
                          {getCategoryName(alert.category_id)}
                        </h4>
                        <Badge variant={alert.percentage >= 100 ? "destructive" : "secondary"}>
                          {alert.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-3">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <span>Gasto: {formatCurrency(alert.amount_spent)}</span>
                          <span>Limite: {formatCurrency(alert.limit_amount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(alert.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsRead(alert.id)}
                    className="ml-4"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Marcar como lido
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Read Alerts */}
      {readAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-slate-400" />
            Alertas Lidos
          </h3>
          
          {readAlerts.slice(0, 5).map((alert) => (
            <Card key={alert.id} className="finance-card opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-700">
                        {getCategoryName(alert.category_id)}
                      </h4>
                      <Badge variant="outline">
                        {alert.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>Gasto: {formatCurrency(alert.amount_spent)}</span>
                        <span>Limite: {formatCurrency(alert.limit_amount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(alert.date)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {readAlerts.length > 5 && (
            <div className="text-center text-sm text-slate-500">
              ... e mais {readAlerts.length - 5} alertas lidos
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;