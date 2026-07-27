'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { Button, Card, Input } from '@/components/atoms';
import { BinIcon, CollapseIcon, DiscountIcon } from '@/icons';
import { applyPromotions, deletePromotionCode } from '@/lib/data/cart';
import { toast } from '@/lib/helpers/toast';
import { cn } from '@/lib/utils';

export const PromoCode = ({ cart, defaultOpen = false }: { cart: any; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [promoCode, setPromoCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
      }
    }, 100);
  }, [cart?.promotions, isPending]);

  const openHandler = () => {
    setIsOpen(!isOpen);
  };

  const handleApplyCode = () => {
    if (!promoCode || isPending) return;

    setHasError(false);
    startTransition(async () => {
      const result = await applyPromotions([promoCode]);

      if (!result.success) {
        toast.info({ title: result.error });
        setHasError(true);
        return;
      }

      if (!result.applied) {
        toast.info({ title: 'Promotion code not found' });
        setHasError(true);
        return;
      }

      toast.success({ title: 'Promotion code applied' });
      setPromoCode('');
      setHasError(false);
    });
  };

  const handleRemoveCode = (code: string) => {
    if (isPending) return;

    startTransition(async () => {
      try {
        await deletePromotionCode(code);
        toast.success({ title: 'Promotion code removed' });
      } catch {
        toast.info({ title: 'Failed to remove promotion code' });
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCode();
    }
  };

  return (
    <Card>
      <div
        onClick={openHandler}
        className="flex cursor-pointer items-center justify-between px-2"
      >
        <div className="flex items-center gap-2">
          <DiscountIcon size={20} />
          <h4 className="label-md">Have promo code?</h4>
        </div>
        <CollapseIcon
          size={20}
          className={cn('transition-all duration-300', isOpen && 'rotate-180')}
        />
      </div>
      <div
        className={cn('overflow-hidden transition-all duration-300')}
        style={{
          maxHeight: isOpen ? `${height}px` : '0px',
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out'
        }}
      >
        <div
          ref={contentRef}
          className="px-2 pt-4"
        >
          {!cart?.promotions?.length ? (
            <div className="flex w-full items-center gap-3 [&>div]:flex-grow">
              <Input
                type="text"
                value={promoCode}
                onChange={e => {
                  setPromoCode(e.target.value);
                  setHasError(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter code"
                error={hasError}
                className="h-12 flex-grow"
              />
              <Button
                onClick={handleApplyCode}
                disabled={isPending || !promoCode}
                loading={isPending}
                size="large"
                className="mt-2 h-12"
                variant="filled"
              >
                ACTIVATE
              </Button>
            </div>
          ) : (
            cart.promotions.map((promo: any) => (
              <div
                key={promo.id}
                className="flex items-center justify-between py-2"
              >
                <span>{promo.code}</span>
                <button
                  onClick={() => handleRemoveCode(promo.code)}
                  disabled={isPending}
                  className="text-primary transition-colors hover:text-red-500 disabled:opacity-50"
                >
                  <BinIcon size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
