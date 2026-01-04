/**
 * PokeMart Page
 *
 * Item shop interface where players can browse items by category,
 * add items to a shopping cart, and complete purchases.
 *
 * Features:
 * - Browse catalog by category (Poke Balls, Medicine, Hold Items, TMs)
 * - Shopping cart with quantity management
 * - Purchase flow with success/error modals
 * - Insufficient funds handling
 * - Network error handling with retry options
 *
 * Feature: 013-pokemart-page
 */

import React, { useState, useEffect, useCallback } from 'react';
import GameLayout from '../components/layout/GameLayout';
import CurrencyBadge from '../components/layout/CurrencyBadge';
import { useGame } from '../lib/gameContext';
import { apiFetch } from '../lib/apiFetch';

// Category configuration
const CATEGORIES = [
  { id: 'pokeball', label: 'Poke Balls' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'holditem', label: 'Hold Items' },
  { id: 'tm', label: 'TMs' },
];

/**
 * ShopHeader - Page title with currency display
 */
function ShopHeader({ currency }) {
  return (
    <div className="shop-header">
      <h1>PokeMart</h1>
      <CurrencyBadge amount={currency} />

      <style jsx>{`
        .shop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .shop-header h1 {
          font-size: 28px;
          color: #fbbf24;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * CategoryTabs - Tab navigation for item categories
 */
function CategoryTabs({ activeTab, onTabChange }) {
  return (
    <div className="category-tabs">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          className={`tab ${activeTab === category.id ? 'tab--active' : ''}`}
          onClick={() => onTabChange(category.id)}
        >
          {category.label}
        </button>
      ))}

      <style jsx>{`
        .category-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tab {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
        }

        .tab--active {
          background: rgba(251, 191, 36, 0.2);
          border-color: #fbbf24;
          color: #fbbf24;
        }

        .tab--active:hover {
          background: rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }
      `}</style>
    </div>
  );
}

/**
 * ItemCard - Single item display in the catalog grid
 */
function ItemCard({ item, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 99) {
      setQuantity(value);
    }
  };

  const handleAdd = () => {
    onAddToCart(item, quantity);
    setQuantity(1);
  };

  return (
    <div className="item-card">
      <div className="item-card__header">
        <h3 className="item-card__name">{item.name}</h3>
        <span className="item-card__price">{item.cost.toLocaleString()}</span>
      </div>
      <p className="item-card__description">{item.description}</p>
      <div className="item-card__actions">
        <input
          type="number"
          min="1"
          max="99"
          value={quantity}
          onChange={handleQuantityChange}
          className="item-card__quantity"
        />
        <button onClick={handleAdd} className="item-card__add-btn">
          Add to Cart
        </button>
      </div>

      <style jsx>{`
        .item-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          transition: border-color 0.2s ease;
        }

        .item-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .item-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .item-card__name {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .item-card__price {
          font-size: 14px;
          font-weight: 600;
          color: #fbbf24;
        }

        .item-card__description {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .item-card__actions {
          display: flex;
          gap: 8px;
        }

        .item-card__quantity {
          width: 60px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 14px;
          text-align: center;
        }

        .item-card__quantity:focus {
          outline: none;
          border-color: #fbbf24;
        }

        .item-card__add-btn {
          flex: 1;
          padding: 8px 16px;
          background: #4ade80;
          border: none;
          border-radius: 6px;
          color: #1a1a2e;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .item-card__add-btn:hover {
          background: #22c55e;
        }
      `}</style>
    </div>
  );
}

/**
 * ItemCatalog - Grid of items in selected category
 */
function ItemCatalog({ items, loading, error, onRetry, onAddToCart }) {
  if (loading) {
    return (
      <div className="catalog-loading">
        <div className="spinner"></div>
        <p>Loading catalog...</p>

        <style jsx>{`
          .catalog-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: rgba(255, 255, 255, 0.6);
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #fbbf24;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-error">
        <p>Failed to load catalog</p>
        <button onClick={onRetry}>Retry</button>

        <style jsx>{`
          .catalog-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: #f87171;
          }

          .catalog-error button {
            margin-top: 16px;
            padding: 10px 24px;
            background: #fbbf24;
            border: none;
            border-radius: 8px;
            color: #1a1a2e;
            font-weight: 600;
            cursor: pointer;
          }

          .catalog-error button:hover {
            background: #f59e0b;
          }
        `}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="catalog-empty">
        <p>No items in this category</p>

        <style jsx>{`
          .catalog-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: rgba(255, 255, 255, 0.4);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="item-catalog">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onAddToCart={onAddToCart} />
      ))}

      <style jsx>{`
        .item-catalog {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
      `}</style>
    </div>
  );
}

/**
 * CartItem - Single item row in the shopping cart
 */
function CartItem({ cartItem, onUpdateQuantity, onRemove }) {
  const { item, quantity, lineTotal } = cartItem;

  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < 99) {
      onUpdateQuantity(item.id, quantity + 1);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item__info">
        <span className="cart-item__name">{item.name}</span>
        <span className="cart-item__unit-price">
          {item.cost.toLocaleString()} each
        </span>
      </div>
      <div className="cart-item__controls">
        <button
          className="cart-item__qty-btn"
          onClick={handleDecrease}
          disabled={quantity <= 1}
        >
          -
        </button>
        <span className="cart-item__quantity">{quantity}</span>
        <button
          className="cart-item__qty-btn"
          onClick={handleIncrease}
          disabled={quantity >= 99}
        >
          +
        </button>
      </div>
      <div className="cart-item__total">
        <span className="cart-item__line-total">
          {lineTotal.toLocaleString()}
        </span>
        <button className="cart-item__remove" onClick={() => onRemove(item.id)}>
          X
        </button>
      </div>

      <style jsx>{`
        .cart-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .cart-item__info {
          flex: 1;
          min-width: 0;
        }

        .cart-item__name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cart-item__unit-price {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .cart-item__controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cart-item__qty-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cart-item__qty-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .cart-item__qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .cart-item__quantity {
          min-width: 30px;
          text-align: center;
          font-size: 14px;
          color: white;
        }

        .cart-item__total {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cart-item__line-total {
          font-size: 14px;
          font-weight: 600;
          color: #fbbf24;
          min-width: 60px;
          text-align: right;
        }

        .cart-item__remove {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(248, 113, 113, 0.2);
          border: none;
          border-radius: 4px;
          color: #f87171;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cart-item__remove:hover {
          background: rgba(248, 113, 113, 0.4);
        }
      `}</style>
    </div>
  );
}

/**
 * ShoppingCart - Cart sidebar with items and purchase button
 */
function ShoppingCart({
  cart,
  totalCost,
  currency,
  purchasing,
  onUpdateQuantity,
  onRemove,
  onPurchase,
}) {
  const cartItems = Array.from(cart.values());
  const isEmpty = cartItems.length === 0;
  const canAfford = totalCost <= currency;

  return (
    <div className="shopping-cart">
      <h2 className="shopping-cart__title">Shopping Cart</h2>

      {isEmpty ? (
        <div className="shopping-cart__empty">
          <p>Your cart is empty</p>
          <p className="shopping-cart__hint">
            Add items from the catalog to get started
          </p>
        </div>
      ) : (
        <>
          <div className="shopping-cart__items">
            {cartItems.map((cartItem) => (
              <CartItem
                key={cartItem.item.id}
                cartItem={cartItem}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>

          <div className="shopping-cart__summary">
            <div className="shopping-cart__total">
              <span>Total:</span>
              <span className={`shopping-cart__total-amount ${!canAfford ? 'shopping-cart__total-amount--over' : ''}`}>
                {totalCost.toLocaleString()}
              </span>
            </div>
            {!canAfford && (
              <p className="shopping-cart__warning">
                Insufficient funds ({currency.toLocaleString()} available)
              </p>
            )}
          </div>

          <button
            className="shopping-cart__purchase-btn"
            onClick={onPurchase}
            disabled={isEmpty || purchasing}
          >
            {purchasing ? 'Processing...' : 'Purchase'}
          </button>
        </>
      )}

      <style jsx>{`
        .shopping-cart {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          height: fit-content;
        }

        .shopping-cart__title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0 0 16px 0;
        }

        .shopping-cart__empty {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.4);
        }

        .shopping-cart__empty p {
          margin: 0;
        }

        .shopping-cart__hint {
          font-size: 13px;
          margin-top: 8px !important;
        }

        .shopping-cart__items {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .shopping-cart__summary {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 16px;
          margin-bottom: 16px;
        }

        .shopping-cart__total {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .shopping-cart__total-amount {
          color: #fbbf24;
        }

        .shopping-cart__total-amount--over {
          color: #f87171;
        }

        .shopping-cart__warning {
          font-size: 12px;
          color: #f87171;
          margin: 8px 0 0 0;
        }

        .shopping-cart__purchase-btn {
          width: 100%;
          padding: 14px;
          background: #4ade80;
          border: none;
          border-radius: 8px;
          color: #1a1a2e;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
        }

        .shopping-cart__purchase-btn:hover:not(:disabled) {
          background: #22c55e;
        }

        .shopping-cart__purchase-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

/**
 * PurchaseModal - Success confirmation after purchase
 */
function PurchaseModal({ results, newBalance, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Purchase Complete!</h2>
        <div className="modal__items">
          {results.map((result, index) => (
            <div key={index} className="modal__item">
              <span>{result.name}</span>
              <span>x{result.quantity}</span>
              <span className="modal__item-cost">
                {result.total_cost.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="modal__balance">
          <span>New Balance:</span>
          <span className="modal__balance-amount">
            {newBalance.toLocaleString()}
          </span>
        </div>
        <button className="modal__btn" onClick={onClose}>
          Continue Shopping
        </button>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal {
            background: #16213e;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
          }

          .modal__title {
            font-size: 24px;
            font-weight: 600;
            color: #4ade80;
            margin: 0 0 24px 0;
            text-align: center;
          }

          .modal__items {
            margin-bottom: 24px;
          }

          .modal__item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
          }

          .modal__item-cost {
            color: #fbbf24;
            font-weight: 500;
          }

          .modal__balance {
            display: flex;
            justify-content: space-between;
            padding: 16px;
            background: rgba(74, 222, 128, 0.1);
            border-radius: 8px;
            margin-bottom: 24px;
            font-weight: 600;
            color: white;
          }

          .modal__balance-amount {
            color: #fbbf24;
          }

          .modal__btn {
            width: 100%;
            padding: 14px;
            background: #4ade80;
            border: none;
            border-radius: 8px;
            color: #1a1a2e;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .modal__btn:hover {
            background: #22c55e;
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * InsufficientFundsModal - Error when player can't afford purchase
 */
function InsufficientFundsModal({ details, onClose }) {
  const shortfall = details.required - details.available;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Insufficient Funds</h2>
        <div className="modal__details">
          <div className="modal__row">
            <span>Item:</span>
            <span>{details.item_name} x{details.quantity}</span>
          </div>
          <div className="modal__row">
            <span>Required:</span>
            <span className="modal__required">{details.required.toLocaleString()}</span>
          </div>
          <div className="modal__row">
            <span>Available:</span>
            <span className="modal__available">{details.available.toLocaleString()}</span>
          </div>
          <div className="modal__row modal__row--shortfall">
            <span>Shortfall:</span>
            <span className="modal__shortfall">{shortfall.toLocaleString()}</span>
          </div>
        </div>
        <p className="modal__message">
          You need {shortfall.toLocaleString()} more currency to complete this purchase.
        </p>
        <button className="modal__btn" onClick={onClose}>
          OK
        </button>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal {
            background: #16213e;
            border: 1px solid rgba(248, 113, 113, 0.3);
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
          }

          .modal__title {
            font-size: 24px;
            font-weight: 600;
            color: #f87171;
            margin: 0 0 24px 0;
            text-align: center;
          }

          .modal__details {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          }

          .modal__row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: white;
            font-size: 14px;
          }

          .modal__row--shortfall {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 8px;
            padding-top: 16px;
          }

          .modal__required {
            color: #fbbf24;
          }

          .modal__available {
            color: #4ade80;
          }

          .modal__shortfall {
            color: #f87171;
            font-weight: 600;
          }

          .modal__message {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            text-align: center;
            margin: 0 0 24px 0;
          }

          .modal__btn {
            width: 100%;
            padding: 14px;
            background: #f87171;
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .modal__btn:hover {
            background: #ef4444;
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * NetworkErrorModal - Error when API call fails
 */
function NetworkErrorModal({ message, onRetry, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Network Error</h2>
        <p className="modal__message">{message || 'Unable to complete your request. Please try again.'}</p>
        <div className="modal__actions">
          <button className="modal__btn modal__btn--retry" onClick={onRetry}>
            Retry
          </button>
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal {
            background: #16213e;
            border: 1px solid rgba(248, 113, 113, 0.3);
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
          }

          .modal__title {
            font-size: 24px;
            font-weight: 600;
            color: #f87171;
            margin: 0 0 16px 0;
            text-align: center;
          }

          .modal__message {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            text-align: center;
            margin: 0 0 24px 0;
          }

          .modal__actions {
            display: flex;
            gap: 12px;
          }

          .modal__btn {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .modal__btn--retry {
            background: #fbbf24;
            color: #1a1a2e;
          }

          .modal__btn--retry:hover {
            background: #f59e0b;
          }

          .modal__btn--cancel {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .modal__btn--cancel:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * PokeMartContent - Main content component with shop logic
 */
function PokeMartContent() {
  const { currency, refreshData } = useGame();

  // Catalog state
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('pokeball');
  const [cart, setCart] = useState(new Map());
  const [purchasing, setPurchasing] = useState(false);

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false);
  const [purchaseResults, setPurchaseResults] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);
  const [networkErrorMessage, setNetworkErrorMessage] = useState('');
  const [newBalance, setNewBalance] = useState(0);

  // Fetch catalog on mount
  const fetchCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);

    try {
      const response = await fetch('/api/shop');
      const data = await response.json();

      if (data.success) {
        setCatalog(data.data.items);
      } else {
        setCatalogError(data.error?.message || 'Failed to load catalog');
      }
    } catch (err) {
      setCatalogError('Network error. Please check your connection.');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Filter items by active category
  const filteredItems = catalog.filter(
    (item) => item.type === activeTab && item.cost !== null
  );

  // Calculate cart total
  const totalCost = Array.from(cart.values()).reduce(
    (sum, cartItem) => sum + cartItem.lineTotal,
    0
  );

  // Cart operations
  const addToCart = (item, quantity) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(item.id);

      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, 99);
        newCart.set(item.id, {
          item,
          quantity: newQuantity,
          lineTotal: item.cost * newQuantity,
        });
      } else {
        newCart.set(item.id, {
          item,
          quantity,
          lineTotal: item.cost * quantity,
        });
      }

      return newCart;
    });
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(itemId);

      if (existing) {
        newCart.set(itemId, {
          ...existing,
          quantity: newQuantity,
          lineTotal: existing.item.cost * newQuantity,
        });
      }

      return newCart;
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      newCart.delete(itemId);
      return newCart;
    });
  };

  // Store last purchase attempt for retry
  const [lastPurchaseAttempt, setLastPurchaseAttempt] = useState(null);

  // Purchase handler
  const handlePurchase = async () => {
    if (cart.size === 0 || purchasing) return;

    setPurchasing(true);
    const results = [];
    let finalBalance = currency;

    // Store cart for potential retry
    setLastPurchaseAttempt(new Map(cart));

    try {
      for (const [itemId, cartItem] of cart) {
        const response = await apiFetch('/api/shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: itemId,
            quantity: cartItem.quantity,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          if (data.error?.code === 'INSUFFICIENT_FUNDS') {
            setErrorDetails(data.error.details);
            setShowErrorModal(true);
            break;
          }
          throw new Error(data.error?.message || 'Purchase failed');
        }

        results.push(data.data.purchased);
        finalBalance = data.data.balance.remaining;
      }

      if (results.length > 0) {
        setPurchaseResults(results);
        setNewBalance(finalBalance);
        await refreshData();
        setCart(new Map());
        setShowSuccessModal(true);
      }
    } catch (err) {
      setNetworkErrorMessage(err.message || 'Network error during purchase');
      setShowNetworkErrorModal(true);
    } finally {
      setPurchasing(false);
    }
  };

  // Retry purchase handler
  const handleRetryPurchase = () => {
    setShowNetworkErrorModal(false);
    if (lastPurchaseAttempt && lastPurchaseAttempt.size > 0) {
      setCart(lastPurchaseAttempt);
      // Trigger purchase on next tick after cart is set
      setTimeout(() => handlePurchase(), 0);
    }
  };

  return (
    <div className="pokemart-page">
      <ShopHeader currency={currency} />
      <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pokemart-layout">
        <div className="pokemart-catalog">
          <ItemCatalog
            items={filteredItems}
            loading={catalogLoading}
            error={catalogError}
            onRetry={fetchCatalog}
            onAddToCart={addToCart}
          />
        </div>
        <div className="pokemart-sidebar">
          <ShoppingCart
            cart={cart}
            totalCost={totalCost}
            currency={currency}
            purchasing={purchasing}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onPurchase={handlePurchase}
          />
        </div>
      </div>

      {showSuccessModal && (
        <PurchaseModal
          results={purchaseResults}
          newBalance={newBalance}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showErrorModal && errorDetails && (
        <InsufficientFundsModal
          details={errorDetails}
          onClose={() => {
            setShowErrorModal(false);
            setErrorDetails(null);
          }}
        />
      )}

      {showNetworkErrorModal && (
        <NetworkErrorModal
          message={networkErrorMessage}
          onRetry={handleRetryPurchase}
          onClose={() => {
            setShowNetworkErrorModal(false);
            setNetworkErrorMessage('');
          }}
        />
      )}

      <style jsx>{`
        .pokemart-page {
          color: white;
        }

        .pokemart-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }

        .pokemart-catalog {
          min-width: 0;
        }

        .pokemart-sidebar {
          min-width: 0;
        }

        @media (max-width: 900px) {
          .pokemart-layout {
            grid-template-columns: 1fr;
          }

          .pokemart-sidebar {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * PokeMartPage - Main page export with GameLayout wrapper
 */
export default function PokeMartPage() {
  return (
    <GameLayout>
      <PokeMartContent />
    </GameLayout>
  );
}
