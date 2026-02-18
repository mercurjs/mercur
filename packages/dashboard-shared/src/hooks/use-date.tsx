import { format, formatDistance, sub } from "date-fns";

// TODO: We rely on the current language to determine the date locale. This is not ideal, as we use en-US for the english translation.
// We either need to also have an en-GB translation or we need to separate the date locale from the translation language.
export const useDate = () => {
  const getFullDate = ({
    date,
    includeTime = false,
  }: {
    date: string | Date;
    includeTime?: boolean;
  }) => {
    const ensuredDate = new Date(date);

    if (isNaN(ensuredDate.getTime())) {
      return "";
    }

    const timeFormat = includeTime ? "p" : "";

    return format(ensuredDate, `PP ${timeFormat}`);
  };

  function getRelativeDate(date: string | Date): string {
    const now = new Date();

    return formatDistance(sub(new Date(date), { minutes: 0 }), now, {
      addSuffix: true,
    });
  }

  return {
    getFullDate,
    getRelativeDate,
  };
};
