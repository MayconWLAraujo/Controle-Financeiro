import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from "lucide-react";

const Dashboard = ({ data, categories, onRefresh }) => {
  if (!data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="finance-card">
            <CardHeader className="pb-2">
              <div className="loading-skeleton h-4 w-24 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="loading-skeleton h-8 w-32 rounded mb-2"></div>
              <div className="loading-skeleton h-3 w-16 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="finance-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(data.total_balance)}`}>
              {formatCurrency(data.total_balance)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Receitas - Gastos
            </p>
          </CardContent>
        </Card>

        <Card className="finance-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Receitas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.monthly_income)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total: {formatCurrency(data.total_income)}
            </p>
          </CardContent>
        </Card>

        <Card className="finance-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Gastos (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(data.monthly_expenses)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total: {formatCurrency(data.total_expenses)}
            </p>
          </CardContent>
        </Card>

        <Card className="finance-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Saldo Mensal</CardTitle>
            <Target className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(data.monthly_balance)}`}>
              {formatCurrency(data.monthly_balance)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Spending */}
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Gastos por Categoria (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.category_spending.length > 0 ? (
              <div className="space-y-4">
                {data.category_spending
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 6)
                  .map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="category-dot"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {category.category}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>Nenhum gasto registrado este mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Transações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_transactions.length > 0 ? (
              <div className="space-y-3">
                {data.recent_transactions.slice(0, 8).map((transaction, index) => (
                  <div key={index} className="transaction-item flex items-center justify-between py-2 px-3 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {transaction.description}
                        </p>
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {transaction.category_name || 'Sem categoria'}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>Nenhuma transação encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;