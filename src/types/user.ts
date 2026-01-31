export interface User {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  hotel?: string; // Hotel ID
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthUser extends User {
  token?: string;
}
