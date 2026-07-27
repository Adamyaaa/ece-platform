import { IUser } from '../models/User';
import { FirebaseUser } from '../middleware/firebaseAuth';

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseUser;
      mongoUser?: IUser;
    }
  }
}

export {};
