import dayjs from 'dayjs'

export const formatDate = (date: string) => {
  return dayjs(date).format('MMM DD, YYYY')
}
