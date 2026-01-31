export interface Hotel {
  _id?: string;
  id?: string;
  name: string;
  address: string;
  phone: string;
  description?: string;
  logo?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
