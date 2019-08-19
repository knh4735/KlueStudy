import { Router } from "express";
import * as authCtrl from './auth.ctrl';

const auth = Router();

auth.post('/register', authCtrl.register);
auth.post('/login', authCtrl.login);
auth.get('/check', authCtrl.check);
auth.post('/logout', authCtrl.logout);

export default auth;