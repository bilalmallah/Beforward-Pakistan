export const CustomerStatus = {
  PROSPECT: 'PROSPECT',
  REGISTERED: 'REGISTERED',
  NEW: 'NEW',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  INTERESTED: 'INTERESTED',
  VEHICLE_REQUESTED: 'VEHICLE_REQUESTED',
  QUOTATION_SENT: 'QUOTATION_SENT',
  NEGOTIATION: 'NEGOTIATION',
  BOOKED: 'BOOKED',
  SOLD: 'SOLD',
  NOT_INTERESTED: 'NOT_INTERESTED',
  OPTED_OUT: 'OPTED_OUT',
  INVALID: 'INVALID',
} as const;

export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const STATUS_LABELS: Record<CustomerStatus, string> = {
  PROSPECT: 'Prospect',
  REGISTERED: 'Registered',
  NEW: 'New',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  INTERESTED: 'Interested',
  VEHICLE_REQUESTED: 'Vehicle Requested',
  QUOTATION_SENT: 'Quotation Sent',
  NEGOTIATION: 'Negotiation',
  BOOKED: 'Booked',
  SOLD: 'Sold',
  NOT_INTERESTED: 'Not Interested',
  OPTED_OUT: 'Opted Out',
  INVALID: 'Invalid',
};

export const STATUS_TONE: Record<CustomerStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  PROSPECT: 'neutral',
  REGISTERED: 'brand',
  NEW: 'brand',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  INTERESTED: 'brand',
  VEHICLE_REQUESTED: 'warning',
  QUOTATION_SENT: 'warning',
  NEGOTIATION: 'warning',
  BOOKED: 'success',
  SOLD: 'success',
  NOT_INTERESTED: 'danger',
  OPTED_OUT: 'danger',
  INVALID: 'danger',
};

export const LeadSource = {
  GOOGLE_PLACES: 'GOOGLE_PLACES',
  WEBSITE: 'WEBSITE',
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  REFERRAL: 'REFERRAL',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  EXISTING_CUSTOMER: 'EXISTING_CUSTOMER',
  TRADE_DIRECTORY: 'TRADE_DIRECTORY',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  IMPORT_CSV: 'IMPORT_CSV',
  API_INTEGRATION: 'API_INTEGRATION',
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  GOOGLE_PLACES: 'Google Places',
  WEBSITE: 'Website',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  REFERRAL: 'Referral',
  EMAIL: 'Email',
  PHONE: 'Phone',
  EXISTING_CUSTOMER: 'Existing Customer',
  TRADE_DIRECTORY: 'Trade Directory',
  MANUAL_ENTRY: 'Manual Entry',
  IMPORT_CSV: 'CSV Import',
  API_INTEGRATION: 'API Integration',
};
