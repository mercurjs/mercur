import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { Filter } from '../../../../../components/table/data-table';

export const useUserTableFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        key: 'created_at',
        label: t('fields.createdAt'),
        type: 'date'
      },
      {
        key: 'updated_at',
        label: t('fields.updatedAt'),
        type: 'date'
      }
    ],
    [t]
  );
};
