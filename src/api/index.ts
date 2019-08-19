import { Router } from "express";
import posts from './posts';
import auth from './auth';

const api:Router = Router();

api.use('/posts', posts);
api.use('/auth', auth);

// 라우터를 내보냅니다.
export default api;