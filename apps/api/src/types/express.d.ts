// Augments Express Request to include the `user` property
// set by the requireAuth middleware after JWT verification.
declare namespace Express {
  interface Request {
    user: {
      id: string;
      email: string;
    };
  }
}
