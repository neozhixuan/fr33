export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // hashed password from the DB
  created_at?: string;
};
