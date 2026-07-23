export type Status = 'Active' | 'Inactive' | 'Suspended'

export interface Department {
  id: string
  name: string
}

export interface Section {
  id: string
  name: string
  department_id: string | null
}

export interface Location {
  id: string
  name: string
  address: string | null
}

export interface Role {
  id: string
  name: string
  description: string | null
  can_approve: boolean
  can_manage: boolean
}

export interface Profile {
  id: string
  username: string
  first_name: string
  surname: string
  id_number: string | null
  contact_number: string | null
  photo_url: string | null
  department_id: string | null
  section_id: string | null
  location_id: string | null
  role_id: string | null
  status: Status
  created_at: string
  // joined
  department?: Department | null
  section?: Section | null
  location?: Location | null
  role?: Role | null
}

export type VehicleStatus = 'Available' | 'Booked' | 'Maintenance' | 'Out of Service'

export interface Vehicle {
  id: string
  registration_number: string
  make: string
  model: string
  year: number | null
  no_of_passengers: number | null
  km: number
  location_id: string | null
  status: VehicleStatus
  photo_url: string | null
  location?: Location | null
}

export type BookingStatus =
  | 'Pending'
  | 'Approved'
  | 'Declined'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'

export interface Booking {
  id: string
  requester_id: string
  purpose: string
  destination: string
  departure_date: string
  departure_time: string | null
  return_date: string | null
  return_time: string | null
  no_of_passengers: number
  department_id: string | null
  status: BookingStatus
  vehicle_id: string | null
  driver_id: string | null
  approved_by: string | null
  approved_at: string | null
  decline_reason: string | null
  notes: string | null
  created_at: string
  // joined
  requester?: Profile | null
  vehicle?: Vehicle | null
  driver?: Profile | null
  department?: Department | null
}
