'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Plus, 
  Search, 
  Users, 
  Building2, 
  Edit3, 
  Save, 
  X, 
  DollarSign,
  RefreshCw,
  User,
  Phone
} from "lucide-react";
import api from "../api";
import { logError, logSuccess } from "@/utils/logger";

const MobileBalanceManager = ({ shopId }) => {
  const [balanceData, setBalanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  
  // Add new balance form data
  const [newBalance, setNewBalance] = useState({
    clientName: '',
    mobileNumber: '',
    balanceAmount: '',
    type: 'Customer' // Customer or Dealer
  });

  useEffect(() => {
    if (shopId) {
      fetchBalanceData();
    }
  }, [shopId]);

  const fetchBalanceData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch customer balances
      const customerResponse = await api.post(
        "/api/customers/balance",
        { shop_id: shopId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch dealer balances
      const dealerResponse = await api.post(
        "/api/dealers/balance",
        { shop_id: shopId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const customers = customerResponse.data.map(customer => ({
        ...customer,
        type: "Customer"
      }));

      const dealers = dealerResponse.data.map(dealer => ({
        ...dealer,
        type: "Dealer"
      }));

      const consolidatedData = [...customers, ...dealers];
      setBalanceData(consolidatedData);
      
    } catch (error) {
      logError("Failed to fetch balance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBalance = async () => {
    if (!newBalance.clientName || !newBalance.mobileNumber || !newBalance.balanceAmount) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint = newBalance.type === 'Customer' ? '/api/customers/add-balance' : '/api/dealers/add-balance';
      
      await api.post(endpoint, {
        shop_id: shopId,
        clientName: newBalance.clientName,
        mobileNumber: newBalance.mobileNumber,
        balanceAmount: parseFloat(newBalance.balanceAmount)
      }, { headers: { Authorization: `Bearer ${token}` } });

      logSuccess("Balance added successfully");
      setNewBalance({ clientName: '', mobileNumber: '', balanceAmount: '', type: 'Customer' });
      setShowAddForm(false);
      fetchBalanceData();
      
    } catch (error) {
      logError("Failed to add balance", error);
      alert("Failed to add balance. Please try again.");
    }
  };

  const handleUpdateBalance = async (index) => {
    const item = balanceData[index];
    const newAmount = parseFloat(editAmount);
    
    if (isNaN(newAmount)) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint = item.type === 'Customer' ? '/api/customers/update-balance' : '/api/dealers/update-balance';
      
      await api.post(endpoint, {
        shop_id: shopId,
        clientId: item._id,
        newBalance: newAmount
      }, { headers: { Authorization: `Bearer ${token}` } });

      logSuccess("Balance updated successfully");
      setEditingIndex(null);
      setEditAmount('');
      fetchBalanceData();
      
    } catch (error) {
      logError("Failed to update balance", error);
      alert("Failed to update balance. Please try again.");
    }
  };

  const filteredData = balanceData.filter(item =>
    item.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mobileNumber?.includes(searchTerm)
  );

  const totalBalance = balanceData.reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0);
  const customerBalance = balanceData.filter(item => item.type === 'Customer').reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0);
  const dealerBalance = balanceData.filter(item => item.type === 'Dealer').reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Balance Manager</h2>
        </div>
        <button
          onClick={fetchBalanceData}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-3 text-center">
            <DollarSign className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-700 font-medium">Total Balance</p>
            <p className="text-lg font-bold text-blue-800">₹{totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-3 text-center">
            <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-700 font-medium">Customers</p>
            <p className="text-lg font-bold text-green-800">₹{customerBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-3 text-center">
            <Building2 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-purple-700 font-medium">Dealers</p>
            <p className="text-lg font-bold text-purple-800">₹{dealerBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add New Balance</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNewBalance(prev => ({ ...prev, type: 'Customer' }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newBalance.type === 'Customer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setNewBalance(prev => ({ ...prev, type: 'Dealer' }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newBalance.type === 'Dealer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dealer
              </button>
            </div>

            <input
              type="text"
              placeholder="Client Name"
              value={newBalance.clientName}
              onChange={(e) => setNewBalance(prev => ({ ...prev, clientName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <input
              type="tel"
              placeholder="Mobile Number"
              value={newBalance.mobileNumber}
              onChange={(e) => setNewBalance(prev => ({ ...prev, mobileNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <input
              type="number"
              placeholder="Balance Amount"
              value={newBalance.balanceAmount}
              onChange={(e) => setNewBalance(prev => ({ ...prev, balanceAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <Button onClick={handleAddBalance} className="w-full">
              Add Balance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balance List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading balance data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No balance records found</p>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredData.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{item.clientName}</span>
                      <Badge variant={item.type === 'Customer' ? 'default' : 'secondary'} className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{item.mobileNumber}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {editingIndex === index ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateBalance(index)}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null);
                            setEditAmount('');
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-green-600">
                          ₹{parseFloat(item.balanceAmount || 0).toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setEditAmount(item.balanceAmount || '0');
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileBalanceManager;
