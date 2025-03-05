import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {getTransactions, createTransaction} from '../services/transactionService';
import {getCategories} from '../services/categoryService';
import {getPaymentMethods} from '../services/paymentMethodService';
import Modal from './Modal';
import ModalCreatePaymentMethod from './ModalCreatePaymentMethod';

export default function TransactionList() {
    const {auth} = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showNewForm, setShowNewForm] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        paymentMethodId: ''
    });

    useEffect(() => {
        if (auth) {
            Promise.all([
                getTransactions(auth),
                getCategories(auth),
                getPaymentMethods(auth)
            ]).then(([transactionsData, categoriesData, paymentMethodsData]) => {
                setTransactions(transactionsData);
                setCategories(categoriesData);
                setPaymentMethods(paymentMethodsData);
            });
        }
    }, [auth]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTransaction(auth, formData);
            const updatedTransactions = await getTransactions(auth);
            setTransactions(updatedTransactions);
            setShowNewForm(false);
            setFormData({
                title: '',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                categoryId: '',
                paymentMethodId: ''
            });
        } catch (error) {
            console.error('Failed to create transaction:', error);
        }
    };

    const handlePaymentMethodAdded = async () => {
        const updatedMethods = await getPaymentMethods(auth);
        setPaymentMethods(updatedMethods);
        setShowPaymentMethodModal(false);
    };

    const formatAmount = (amount) => {
        return Number(amount).toLocaleString('en-EU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.date.substring(0, 10);
        if (!groups[date]) groups[date] = [];
        groups[date].push(transaction);
        return groups;
    }, {});

    const getCategoryColor = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.color : '#gray';
    };

    return (
        <div className="transaction-list">
            <div className="page-bandeau">
                <h2>Transactions</h2>
                <button className="fab-button" onClick={() => setShowNewForm(true)}>+</button>
            </div>

            {Object.entries(groupedTransactions).map(([date, transactions]) => (
                <div key={date} className="date-group">
                    <h3>{date}</h3>
                    {transactions.map(transaction => (
                        <div key={transaction.id} className="transaction-item">
                            <div
                                className="category-color-indicator"
                                style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                            />
                            <div className="transaction-content">
                                <div className="transaction-title">{transaction.title}</div>
                                <div className="transaction-amount">{formatAmount(transaction.amount)}€</div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} title="Nouvelle Transaction">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Titre"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        required
                    />
                    <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                    <input
                        type="number"
                        placeholder="Montant"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        required
                    />
                    <input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        required
                    />
                    <select
                        value={formData.categoryId}
                        onChange={e => setFormData({...formData, categoryId: e.target.value})}
                        required
                    >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <div className="payment-method-container">
                        <select
                            value={formData.paymentMethodId}
                            onChange={e => setFormData({...formData, paymentMethodId: e.target.value})}
                            required
                        >
                            <option value="">Sélectionner un moyen de paiement</option>
                            {paymentMethods.map(method => (
                                <option key={method.id} value={method.id}>
                                    {method.name} (****{method.lastDigits})
                                </option>
                            ))}
                        </select>
                        <button type="button" onClick={() => setShowPaymentMethodModal(true)}>+</button>
                    </div>
                    <button type="submit">Créer</button>
                </form>
            </Modal>

            <ModalCreatePaymentMethod
                isOpen={showPaymentMethodModal}
                onClose={() => setShowPaymentMethodModal(false)}
                onPaymentMethodAdded={handlePaymentMethodAdded}
            />
        </div>
    );
}
