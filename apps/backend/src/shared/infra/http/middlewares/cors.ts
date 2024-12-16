import cors from 'cors'

export const vendorCors = () =>
  cors({
    origin: process.env.VENDOR_CORS?.split(','),
    credentials: true
  })
