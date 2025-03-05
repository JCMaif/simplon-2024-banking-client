import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createPaymentMethod } from '../services/paymentMethodService';
import Modal from './Modal';

export default function ModalCreatePaymentMethod({ isOpen, onClose, onPaymentMethodAdded }) {
    const { auth } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        lastDigits: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPaymentMethod(auth, formData);
            setFormData({ name: '', lastDigits: '' });
            onPaymentMethodAdded();
        } catch (error) {
            console.error('Échec de l’ajout du moyen de paiement:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un moyen de paiement">
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nom du moyen de paiement"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="4 derniers chiffres"
                    value={formData.lastDigits}
                    maxLength="4"
                    onChange={e => setFormData({ ...formData, lastDigits: e.target.value })}
                />
                <button type="submit">Ajouter</button>
            </form>
        </Modal>
    );
}
