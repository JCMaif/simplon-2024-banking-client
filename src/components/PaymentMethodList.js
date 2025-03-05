import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPaymentMethods, deletePaymentMethod } from '../services/paymentMethodService';
import ModalCreatePaymentMethod from "./ModalCreatePaymentMethod";

export default function PaymentMethodList() {
    const { auth } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => {
        if (auth) {
            getPaymentMethods(auth).then(setPaymentMethods).catch(error =>
                console.error('Error fetching payment methods:', error)
            );
        }
    }, [auth]);

    const handleDelete = async (methodId) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            try {
                await deletePaymentMethod(auth, methodId);
                setPaymentMethods(prevMethods => prevMethods.filter(method => method.id !== methodId));
            } catch (error) {
                console.error('Failed to delete payment method:', error);
            }
        }
    };

    const handlePaymentMethodAdded = async () => {
        try {
            const updatedMethods = await getPaymentMethods(auth);
            setPaymentMethods(updatedMethods);
            setShowNewForm(false);
        } catch (error) {
            console.error('Error updating payment methods:', error);
        }
    };

    return (
        <div className="payment-method-list">
            <div className="page-bandeau">
                <h2>Payment Methods</h2>
                <button className="fab-button" onClick={() => setShowNewForm(true)}>+</button>
            </div>

            <ModalCreatePaymentMethod
                isOpen={showNewForm}
                onClose={() => setShowNewForm(false)}
                onPaymentMethodAdded={handlePaymentMethodAdded}
            />

            <div className="payment-methods">
                {paymentMethods.length > 0 ? (
                    paymentMethods.map(method => (
                        <div key={method.id} className="payment-method-item">
                            <div className="method-content">
                                <div className="method-name">{method.name}</div>
                                <div className="method-digits">**** **** **** {method.lastDigits}</div>
                            </div>
                            <button
                                className="delete-button"
                                onClick={() => handleDelete(method.id)}
                                aria-label={`Delete ${method.name} payment method`}
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No payment methods available.</p>
                )}
            </div>
        </div>
    );
}
