// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Banknote, QrCode, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

const PayRent = () => {
  const [activeTab, setActiveTab] = useState("mpesa");
  const [amount, setAmount] = useState("");
  const [property, setProperty] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  // Mock data for properties
  const properties = [
    { id: "1", name: "Modern Apartment - Westlands", rent: "45,000" },
    { id: "2", name: "Studio Unit - Kilimani", rent: "32,000" },
    { id: "3", name: "2 Bedroom - Lavington", rent: "68,000" }
  ];

  // Mock payment history
  const paymentHistory = [
    { id: 1, date: "2024-03-01", amount: "45,000", method: "M-Pesa", status: "completed" },
    { id: 2, date: "2024-02-01", amount: "45,000", method: "Card", status: "completed" },
    { id: 3, date: "2024-01-01", amount: "45,000", method: "M-Pesa", status: "completed" },
    { id: 4, date: "2023-12-01", amount: "45,000", method: "Bank Transfer", status: "completed" }
  ];

  const handleMpesaPayment = () => {
    if (!amount || !property || !phoneNumber) {
      alert("Please fill in all required fields");
      return;
    }
    console.log("Processing M-Pesa payment:", { amount, property, phoneNumber });
    // In production, this would call your payment API
  };

  const handleCardPayment = () => {
    if (!amount || !property || !cardNumber || !cardExpiry || !cardCVC) {
      alert("Please fill in all required fields");
      return;
    }
    console.log("Processing card payment:", { amount, property, cardNumber });
    // In production, this would call your payment API
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay Rent</h1>
        <p className="text-gray-600">Secure and convenient rent payment options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Make Payment</CardTitle>
              <CardDescription>Select your property and payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Selection */}
              <div>
                <Label htmlFor="property">Select Property *</Label>
                <Select onValueChange={setProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name} - Ksh {prop.rent}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">Amount (Ksh) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    placeholder="Enter amount"
                  />
                </div>
                {property && (
                  <p className="text-sm text-gray-500 mt-2">
                    Suggested amount: Ksh {properties.find(p => p.id === property)?.rent}
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="mpesa">
                    <Smartphone className="w-4 h-4 mr-2" />
                    M-Pesa
                  </TabsTrigger>
                  <TabsTrigger value="card">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="bank">
                    <Banknote className="w-4 h-4 mr-2" />
                    Bank
                  </TabsTrigger>
                </TabsList>

                {/* M-Pesa Payment */}
                <TabsContent value="mpesa" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="phone">M-Pesa Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07XX XXX XXX"
                    />
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>How it works:</strong> Enter your M-Pesa registered phone number.
                      You'll receive a payment prompt on your phone to complete the transaction.
                    </p>
                  </div>
                  <Button
                    onClick={handleMpesaPayment}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay with M-Pesa
                  </Button>
                </TabsContent>

                {/* Card Payment */}
                <TabsContent value="card" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date *</Label>
                      <Input
                        id="expiry"
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC *</Label>
                      <Input
                        id="cvc"
                        type="text"
                        value={cardCVC}
                        onChange={(e) => setCardCVC(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Secure Payment:</strong> Your card information is encrypted and never stored.
                      We support Visa, MasterCard, and American Express.
                    </p>
                  </div>
                  <Button
                    onClick={handleCardPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with Card
                  </Button>
                </TabsContent>

                {/* Bank Transfer */}
                <TabsContent value="bank" className="space-y-4 pt-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-2">Bank Transfer Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Bank:</strong> Realtors Kenya Bank</p>
                      <p><strong>Account Name:</strong> Realtors Kenya Ltd</p>
                      <p><strong>Account Number:</strong> 1234567890</p>
                      <p><strong>Branch:</strong> Westlands</p>
                      <p><strong>SWIFT Code:</strong> REALKENN</p>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Use your property ID as reference when making the transfer.
                      Payments may take 1-2 business days to reflect.
                    </p>
                  </div>
                  <Button className="w-full" variant="outline">
                    <QrCode className="w-4 h-4 mr-2" />
                    Show QR Code
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent rent payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">{payment.date}</p>
                        <p className="text-sm text-gray-500">{payment.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Ksh {payment.amount}</p>
                      <Badge
                        className={payment.status === "completed" ? "bg-green-100 text-green-800" : ""}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Amount</span>
                  <span className="font-semibold">
                    {property ? `Ksh ${properties.find(p => p.id === property)?.rent}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-semibold">Ksh 500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-semibold">Ksh 100</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      {property ? `Ksh ${(parseInt(properties.find(p => p.id === property)?.rent?.replace(/,/g, '') || '0') + 600).toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Payment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">March 2024</p>
                    <p className="text-sm text-gray-500">Due: 1st March</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">February 2024</p>
                    <p className="text-sm text-gray-500">Paid: 28th Feb</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Paid</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">January 2024</p>
                    <p className="text-sm text-gray-500">Paid: 30th Jan</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Paid</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                Download Receipt
              </Button>
              <Button className="w-full" variant="outline">
                Set Auto-Pay
              </Button>
              <Button className="w-full" variant="outline">
                Contact Landlord
              </Button>
            </CardContent>
          </Card>

          {/* Payment Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• Pay at least 3 days before due date to avoid late fees</p>
              <p>• Keep payment receipts for your records</p>
              <p>• Set up auto-pay for convenience</p>
              <p>• Contact support for payment issues</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PayRent;