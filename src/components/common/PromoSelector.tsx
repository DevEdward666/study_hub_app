import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonChip,
  IonSpinner,
} from '@ionic/react';
import {
  giftOutline,
  pricetagOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { useApplicablePromos, calculatePromoDiscount, isPromoValid, Promo } from '../../hooks/PromoHooks';
import { PesoFormat } from '../../shared/PesoHelper';

interface PromoSelectorProps {
  sessionCost: number;
  selectedPromoId: string | null;
  onPromoSelect: (promoId: string | null, discount: number) => void;
  disabled?: boolean;
}

const PromoSelector: React.FC<PromoSelectorProps> = ({
  sessionCost,
  selectedPromoId,
  onPromoSelect,
  disabled = false,
}) => {
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [calculatedDiscount, setCalculatedDiscount] = useState<number>(0);

  const { data: applicablePromos, isLoading, error } = useApplicablePromos(sessionCost);

  // Filter valid promos
  const validPromos = applicablePromos?.filter(promo => 
    isPromoValid(promo) && sessionCost >= promo.minPurchase
  ) || [];

  useEffect(() => {
    if (selectedPromoId) {
      const promo = validPromos.find(p => p.id === selectedPromoId);
      if (promo) {
        setSelectedPromo(promo);
        const discount = calculatePromoDiscount(promo, sessionCost);
        setCalculatedDiscount(discount);
        onPromoSelect(selectedPromoId, discount);
      }
    } else {
      setSelectedPromo(null);
      setCalculatedDiscount(0);
      onPromoSelect(null, 0);
    }
  }, [selectedPromoId, sessionCost, validPromos, onPromoSelect]);

  const handlePromoSelection = (promoId: string | null) => {
    if (promoId === selectedPromoId) return;

    if (promoId) {
      const promo = validPromos.find(p => p.id === promoId);
      if (promo) {
        const discount = calculatePromoDiscount(promo, sessionCost);
        setSelectedPromo(promo);
        setCalculatedDiscount(discount);
        onPromoSelect(promoId, discount);
      }
    } else {
      setSelectedPromo(null);
      setCalculatedDiscount(0);
      onPromoSelect(null, 0);
    }
  };

  if (isLoading) {
    return (
      <IonItem>
        <IonLabel>
          <IonSpinner name="crescent" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
          Loading promos...
        </IonLabel>
      </IonItem>
    );
  }

  if (error || validPromos.length === 0) {
    return null; // Don't show anything if no promos available
  }

  return (
    <div className="promo-selector" style={{ marginTop: '16px' }}>
      <IonItem>
        <IonIcon icon={giftOutline} slot="start" color="tertiary" />
        <IonLabel position="stacked">Apply Promo (Optional)</IonLabel>
        <IonSelect
          value={selectedPromoId}
          placeholder="Select a promo"
          onIonChange={(e) => handlePromoSelection(e.detail.value)}
          disabled={disabled}
        >
          <IonSelectOption value={null}>No promo</IonSelectOption>
          {validPromos.map((promo) => (
            <IonSelectOption key={promo.id} value={promo.id}>
              {promo.name} - {promo.discountType === 'percentage' 
                ? `${promo.discountValue}% off` 
                : `₱${promo.discountValue} off`}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      {selectedPromo && (
        <IonCard className="promo-details-card" style={{ 
          margin: '8px 0', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <IonCardContent style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: '6px', color: '#4ade80' }} />
              <strong>{selectedPromo.name}</strong>
            </div>
            
            <div style={{ fontSize: '0.9em', marginBottom: '8px', opacity: 0.9 }}>
              {selectedPromo.description}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <IonChip color="light" style={{ margin: 0, fontSize: '0.8em' }}>
                <IonIcon icon={pricetagOutline} />
                <IonLabel>
                  {selectedPromo.discountType === 'percentage' 
                    ? `${selectedPromo.discountValue}% off` 
                    : `₱${selectedPromo.discountValue} off`}
                </IonLabel>
              </IonChip>
              
              {selectedPromo.minPurchase > 0 && (
                <IonChip color="light" style={{ margin: 0, fontSize: '0.8em' }}>
                  <IonLabel>Min: {PesoFormat(selectedPromo.minPurchase)}</IonLabel>
                </IonChip>
              )}

              {selectedPromo.discountType === 'percentage' && selectedPromo.maxDiscount && (
                <IonChip color="light" style={{ margin: 0, fontSize: '0.8em' }}>
                  <IonLabel>Max: {PesoFormat(selectedPromo.maxDiscount)}</IonLabel>
                </IonChip>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '0.85em',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              paddingTop: '8px'
            }}>
              <span>Discount Applied:</span>
              <strong style={{ color: '#4ade80' }}>-{PesoFormat(calculatedDiscount)}</strong>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '0.9em',
              fontWeight: 'bold'
            }}>
              <span>Final Cost:</span>
              <span style={{ color: '#4ade80' }}>{PesoFormat(sessionCost - calculatedDiscount)}</span>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Available Promos List for Reference */}
      {!selectedPromo && validPromos.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <IonText color="medium" style={{ fontSize: '0.85em', display: 'block', marginBottom: '4px' }}>
            {validPromos.length} promo{validPromos.length > 1 ? 's' : ''} available:
          </IonText>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {validPromos.slice(0, 3).map((promo) => (
              <IonChip 
                key={promo.id} 
                color="tertiary" 
                style={{ margin: 0, fontSize: '0.8em', cursor: 'pointer' }}
                onClick={() => handlePromoSelection(promo.id)}
              >
                <IonIcon icon={giftOutline} />
                <IonLabel>{promo.name}</IonLabel>
              </IonChip>
            ))}
            {validPromos.length > 3 && (
              <IonChip color="medium" style={{ margin: 0, fontSize: '0.8em' }}>
                <IonLabel>+{validPromos.length - 3} more</IonLabel>
              </IonChip>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoSelector;