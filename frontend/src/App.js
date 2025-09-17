import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Components
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import CategoriesManager from './components/CategoriesManager';
import GoalsManager from './components/GoalsManager';
import AlertsPanel from './components/AlertsPanel';
import ExportData from './components/ExportData';

// UI Components
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Switch } from "./components/ui/switch";
import { PlusCircle, Home, Target, Settings, Bell, Sun, Moon, Download } from "lucide-react";

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadTransactions();
    loadGoals();
    loadAlerts();
    loadDashboardData();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await axios.get(`${API}/goals`);
      setGoals(response.data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const refreshData = () => {
    loadCategories();
    loadTransactions();
    loadGoals();
    loadAlerts();
    loadDashboardData();
  };

  const unreadAlertsCount = alerts.filter(alert => !alert.is_read).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900'
    }`}>
      <BrowserRouter>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Controle Financeiro
                </h1>
                <p className={isDarkMode ? 'text-gray-300' : 'text-slate-600'}>
                  Gerencie suas finanças de forma inteligente
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Export Button */}
                <Button
                  onClick={() => setShowExportModal(true)}
                  variant="outline"
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
                
                {/* Theme Toggle */}
                <div className="flex items-center gap-3">
                  <Sun className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
                  <Switch 
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
                </div>
                
                <Button 
                  onClick={() => setShowTransactionForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full grid-cols-4 lg:w-fit ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <TabsTrigger 
                  value="dashboard" 
                  className={`flex items-center gap-2 ${
                    isDarkMode 
                      ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300' 
                      : 'data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="categories" 
                  className={`flex items-center gap-2 ${
                    isDarkMode 
                      ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300' 
                      : 'data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className={`flex items-center gap-2 ${
                    isDarkMode 
                      ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300' 
                      : 'data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Metas
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts" 
                  className={`flex items-center gap-2 relative ${
                    isDarkMode 
                      ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300' 
                      : 'data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Alertas
                  {unreadAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadAlertsCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="dashboard">
                  <Dashboard 
                    data={dashboardData} 
                    categories={categories}
                    onRefresh={refreshData}
                  />
                </TabsContent>

                <TabsContent value="categories">
                  <CategoriesManager 
                    categories={categories}
                    onRefresh={loadCategories}
                  />
                </TabsContent>

                <TabsContent value="goals">
                  <GoalsManager 
                    goals={goals}
                    onRefresh={loadGoals}
                  />
                </TabsContent>

                <TabsContent value="alerts">
                  <AlertsPanel 
                    alerts={alerts}
                    categories={categories}
                    onRefresh={loadAlerts}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Transaction Form Modal */}
          {showTransactionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-xl p-6 w-full max-w-md ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <TransactionForm 
                  categories={categories}
                  onSuccess={() => {
                    setShowTransactionForm(false);
                    refreshData();
                  }}
                  onCancel={() => setShowTransactionForm(false)}
                />
              </div>
            </div>
          )}

          {/* Export Modal */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-xl w-full max-w-md ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <ExportData 
                  onClose={() => setShowExportModal(false)}
                />
              </div>
            </div>
          )}
        </div>

        <Routes>
          <Route path="/" element={<div />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;