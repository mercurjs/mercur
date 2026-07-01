'use client';

import { Button } from '@/components/atoms';
import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { ReportListingForm } from '../ReportListingForm/ReportListingForm';

export const ProductReportButton = () => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <Button
        className='uppercase label-md'
        variant='tonal'
        onClick={() => setOpenModal(true)}
      >
        Report listing
      </Button>
      {openModal && (
        <Modal
          heading='Report listing'
          onClose={() => setOpenModal(false)}
        >
          <ReportListingForm
            onClose={() => setOpenModal(false)}
          />
        </Modal>
      )}
    </>
  );
};
