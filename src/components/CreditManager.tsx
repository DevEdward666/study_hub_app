import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CreditManager() {
  const [purchaseAmount, setPurchaseAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const userCredits = useQuery(api.credits.getUserCredits);
  const transactions = useQuery(api.credits.getUserTransactions);
  const purchaseCredits = useMutation(api.credits.purchaseCredits);

  const creditPackages = [
    { amount: 50, cost: 5, popular: false },
    { amount: 100, cost: 10, popular: true },
    { amount: 250, cost: 22.5, popular: false },
    { amount: 500, cost: 40, popular: false },
  ];

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseAmount <= 0) return;

    try {
      setIsPurchasing(true);
      
      // Generate a mock transaction ID (in real app, this would come from payment processor)
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await purchaseCredits({
        amount: purchaseAmount,
        paymentMethod,
        transactionId,
      });

      toast.success("Credit purchase submitted for approval!");
      setPurchaseAmount(100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to purchase credits");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Manage Credits</h2>
        <p className="text-gray-600">Purchase credits to use study tables</p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
          <p className="text-4xl font-bold">{userCredits?.balance ?? 0}</p>
          <p className="text-sm opacity-90 mt-2">credits available</p>
        </div>
      </div>

      {/* Credit Packages */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Credit Packages</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.amount}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                purchaseAmount === pkg.amount
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              } ${pkg.popular ? "ring-2 ring-primary/20" : ""}`}
              onClick={() => setPurchaseAmount(pkg.amount)}
            >
              {pkg.popular && (
                <div className="text-xs bg-primary text-white px-2 py-1 rounded-full text-center mb-2">
                  Popular
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold">{pkg.amount}</p>
                <p className="text-sm text-gray-600">credits</p>
                <p className="text-lg font-semibold text-primary mt-2">
                  ${pkg.cost}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Form */}
      <form onSubmit={handlePurchase} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Amount
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Cost: ${(purchaseAmount * 0.1).toFixed(2)}
          </p>
        </div>

        <div>
          <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            id="payment"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="card">Credit/Debit Card</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={purchaseAmount <= 0 || isPurchasing}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPurchasing ? "Processing..." : `Purchase ${purchaseAmount} Credits`}
        </button>
      </form>

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions?.slice(0, 5).map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{transaction.amount} credits</p>
                <p className="text-sm text-gray-600">
                  {new Date(transaction._creationTime).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${transaction.cost.toFixed(2)}</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    transaction.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : transaction.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
          {!transactions?.length && (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
