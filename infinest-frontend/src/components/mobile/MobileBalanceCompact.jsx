'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Plus, 
  Users, 
  Building2, 
  DollarSign,
  RefreshCw,
  User,
  Phone,
  X,
  ChevronDown,
  Search
} from "lucide-react";
import api from "../api";
import { logError, logSuccess } from "@/utils/logger";

const MobileBalanceCompact = ({ shopId }) => {
  const [balanceData, setBalanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Existing customers and dealers
  const [customers, setCustomers] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  
  // Dropdown states
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  // Add new balance form data
  const [newBalance, setNewBalance] = useState({
    clientName: '',
    mobileNumber: '',
    balanceAmount: '',
    type: 'Customer', // Customer or Dealer
    selectedClientId: null
  });

  useEffect(() => {
    if (shopId) {
      fetchBalanceData();
      fetchExistingClients();
    }
  }, [shopId]);

  const fetchExistingClients = async () => {
    setIsLoadingClients(true);
    try {
      const token = localStorage.getItem("token");
      
      // Use the same API as mobile record form for consistency
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_BILLIT}/api/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shopId }),
      });

      const data = await response.json();
      if (response.ok) {
        const { customers = [], dealers = [] } = data;
        
        // Set customer and dealer lists
        setCustomers(Array.isArray(customers) ? customers : []);
        setDealers(Array.isArray(dealers) ? dealers : []);
      } else {
        console.warn("Failed to fetch clients:", data.error);
        setCustomers([]);
        setDealers([]);
      }
      
    } catch (error) {
      console.warn("Failed to fetch existing clients:", error);
      // Set empty arrays if fetch fails
      setCustomers([]);
      setDealers([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

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

      const customerBalances = Array.isArray(customerResponse.data) ? customerResponse.data : [];
      const dealerBalances = Array.isArray(dealerResponse.data) ? dealerResponse.data : [];

      const combinedData = [
        ...customerBalances.map(item => ({ ...item, type: 'Customer' })),
        ...dealerBalances.map(item => ({ ...item, type: 'Dealer' }))
      ];

      setBalanceData(combinedData);
    } catch (error) {
      logError("Failed to fetch balance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get filtered clients based on selected type and search term
  const getFilteredClients = () => {
    const clientList = newBalance.type === 'Customer' ? customers : dealers;
    if (!clientSearchTerm) return clientList;
    
    return clientList.filter(client => {
      const name = client.client_name || client.name || client.customerName || client.dealerName || '';
      const mobile = client.mobile_number || client.mobileNumber || client.mobile || client.phone || '';
      return name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
             mobile.includes(clientSearchTerm);
    });
  };

  // Handle client selection from dropdown
  const handleClientSelect = (client) => {
    const clientName = client.client_name || client.name || client.customerName || client.dealerName || '';
    const clientMobile = client.mobile_number || client.mobileNumber || client.mobile || client.phone || '';
    
    setNewBalance(prev => ({
      ...prev,
      clientName: clientName,
      mobileNumber: clientMobile,
      selectedClientId: client._id || client.id
    }));
    
    setShowClientDropdown(false);
    setClientSearchTerm('');
  };

  // Reset form when type changes
  const handleTypeChange = (type) => {
    setNewBalance({
      clientName: '',
      mobileNumber: '',
      balanceAmount: '',
      type: type,
      selectedClientId: null
    });
    setClientSearchTerm('');
    setShowClientDropdown(false);
  };

  const handleAddBalance = async () => {
    if (!newBalance.selectedClientId || !newBalance.balanceAmount) {
      alert("Please select a client and enter balance amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Use the same API as AllRecordTable for updating balance
      await api.post("/api/allUpdateBalance", {
        id: newBalance.selectedClientId,
        balanceAmount: parseFloat(newBalance.balanceAmount),
        type: newBalance.type
      }, { headers: { Authorization: `Bearer ${token}` } });

      logSuccess("Balance updated successfully");
      setNewBalance({ 
        clientName: '', 
        mobileNumber: '', 
        balanceAmount: '', 
        type: 'Customer',
        selectedClientId: null
      });
      setShowAddForm(false);
      setClientSearchTerm('');
      setShowClientDropdown(false);
      fetchBalanceData();
      
    } catch (error) {
      logError("Failed to update balance", error);
      alert("Failed to update balance. Please try again.");
    }
  };

  const totalBalance = balanceData.reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0);
  const customerBalance = balanceData.filter(item => item.type === 'Customer').reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0);
  const dealerBalance = balanceData.filter(item => item.type === 'Dealer').reduce((sum, item) => sum + (parseFloat(item.balanceAmount) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-3 text-center">
            <DollarSign className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-700 font-medium">Total</p>
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

      {/* Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-blue-600" />
          Outstanding Balances
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={fetchBalanceData}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Update</span>
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Update Balance</h4>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setShowClientDropdown(false);
                  setClientSearchTerm('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTypeChange('Customer')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newBalance.type === 'Customer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => handleTypeChange('Dealer')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newBalance.type === 'Dealer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dealer
              </button>
            </div>

            {/* Client Selection Dropdown */}
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Select {newBalance.type}
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-left flex items-center justify-between"
                >
                  <span className={newBalance.clientName ? 'text-gray-900' : 'text-gray-500'}>
                    {newBalance.clientName || `Select ${newBalance.type}...`}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showClientDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showClientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={`Search ${newBalance.type.toLowerCase()}s...`}
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Existing Clients List */}
                    {isLoadingClients ? (
                      <div className="p-3 text-center">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-500">Loading...</p>
                      </div>
                    ) : (
                      <>
                        {getFilteredClients().length === 0 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            {clientSearchTerm ? 'No matching clients found' : `No ${newBalance.type.toLowerCase()}s found`}
                          </div>
                        ) : (
                          getFilteredClients().map((client, index) => {
                            const clientName = client.client_name || client.name || client.customerName || client.dealerName || '';
                            const clientMobile = client.mobile_number || client.mobileNumber || client.mobile || client.phone || '';
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleClientSelect(client)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{clientName}</p>
                                    {clientMobile && (
                                      <p className="text-xs text-gray-500">{clientMobile}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Balance Amount Field */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Balance Amount</label>
              <input
                type="number"
                placeholder="Enter balance amount"
                value={newBalance.balanceAmount}
                onChange={(e) => setNewBalance(prev => ({ ...prev, balanceAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <Button 
              onClick={handleAddBalance} 
              className="w-full"
              disabled={!newBalance.selectedClientId || !newBalance.balanceAmount}
            >
              Update Balance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Balances */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : balanceData.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No outstanding balances</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {balanceData.slice(0, 5).map((item, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-3 h-3 text-gray-600" />
                        <span className="font-medium text-sm text-gray-900">{item.clientName}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.type === 'Customer' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Phone className="w-3 h-3" />
                        <span>{item.mobileNumber}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-green-600">
                        ₹{parseFloat(item.balanceAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {balanceData.length > 5 && (
              <Card>
                <CardContent className="p-2 text-center">
                  <p className="text-xs text-gray-500">
                    +{balanceData.length - 5} more balances
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileBalanceCompact;
