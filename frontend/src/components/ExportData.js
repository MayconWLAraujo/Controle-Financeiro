import React, { useState } from 'react';
import axios from 'axios';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Download, FileText, Database, Calendar } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExportData = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [exportInfo, setExportInfo] = useState(null);

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (objArray, headers) => {
    const csvHeaders = headers.join(',');
    const csvRows = objArray.map(obj => 
      headers.map(header => {
        const value = obj[header] || '';
        // Handle values with commas or quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleExportJSON = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/export/data`);
      const exportData = response.data;
      
      setExportInfo(exportData.summary);
      
      const filename = `controle-financeiro-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(exportData, filename);
      
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Erro ao exportar dados em JSON. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/export/data`);
      const exportData = response.data;
      
      setExportInfo(exportData.summary);
      
      const date = new Date().toISOString().split('T')[0];
      
      // Export transactions as CSV
      if (exportData.data.transactions.length > 0) {
        const transactionHeaders = ['id', 'description', 'amount', 'type', 'category_id', 'date', 'created_at'];
        const transactionCSV = convertToCSV(exportData.data.transactions, transactionHeaders);
        downloadCSV(transactionCSV, `transacoes-${date}.csv`);
      }
      
      // Export categories as CSV
      if (exportData.data.categories.length > 0) {
        const categoryHeaders = ['id', 'name', 'type', 'limit_enabled', 'monthly_limit', 'color', 'created_at'];
        const categoryCSV = convertToCSV(exportData.data.categories, categoryHeaders);
        downloadCSV(categoryCSV, `categorias-${date}.csv`);
      }
      
      // Export goals as CSV
      if (exportData.data.goals.length > 0) {
        const goalHeaders = ['id', 'title', 'description', 'target_amount', 'current_amount', 'target_date', 'created_at'];
        const goalCSV = convertToCSV(exportData.data.goals, goalHeaders);
        downloadCSV(goalCSV, `metas-${date}.csv`);
      }
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Erro ao exportar dados em CSV. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto finance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Download className="w-5 h-5" />
          Exportar Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Exporte todos os seus dados financeiros para backup ou uso em outras ferramentas.
        </div>
        
        {exportInfo && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="text-sm text-emerald-800 dark:text-emerald-300">
              <p className="font-medium mb-2">Dados exportados com sucesso!</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Categorias: {exportInfo.total_categories}</div>
                <div>Transações: {exportInfo.total_transactions}</div>
                <div>Metas: {exportInfo.total_goals}</div>
                <div>Alertas: {exportInfo.total_alerts}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={handleExportJSON}
            disabled={loading}
            className="w-full btn-primary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {loading ? 'Exportando...' : 'Exportar JSON'}
          </Button>
          
          <Button
            onClick={handleExportCSV}
            disabled={loading}
            variant="outline"
            className="w-full flex items-center gap-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Database className="w-4 h-4" />
            {loading ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
        
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p><strong>JSON:</strong> Arquivo único com todos os dados para backup completo</p>
          <p><strong>CSV:</strong> Arquivos separados (transações, categorias, metas) para planilhas</p>
        </div>
        
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-slate-300 dark:border-slate-600"
          >
            Fechar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportData;