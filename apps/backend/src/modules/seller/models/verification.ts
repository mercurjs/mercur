import { model } from '@medusajs/framework/utils'
import { Seller } from './seller'

export const SellerVerification = model.define('seller_verification', {
  id: model.id({ prefix: 'sel_ver' }).primaryKey(),
  seller: model.belongsTo(() => Seller, { mappedBy: 'verification' }),
  
  // Business Registration
  gstin: model.text().nullable(),
  company_registration: model.text().nullable(),
  msme_registration: model.text().nullable(),
  
  // Tax Information
  pan_number: model.text().nullable(),
  tan_number: model.text().nullable(),
  
  // Manufacturing Details
  manufacturing_license: model.text().nullable(),
  factory_license: model.text().nullable(),
  manufacturing_capacity: model.text().nullable(),
  
  // Quality Certifications
  iso_certificates: model.text().nullable(),
  industry_certifications: model.text().nullable(),
  quality_control_certificates: model.text().nullable(),
  
  // Compliance Documents
  environmental_clearance: model.text().nullable(),
  safety_certificates: model.text().nullable(),
  labor_compliance: model.text().nullable(),
  
  // Verification Status
  verification_status: model.enum(['pending', 'in_progress', 'verified', 'rejected']).default('pending'),
  verification_notes: model.text().nullable(),
  verified_at: model.dateTime().nullable(),
  verified_by: model.text().nullable(),
  
  // Document Uploads
  documents: model.json().nullable(), // Store document URLs and metadata
}) 