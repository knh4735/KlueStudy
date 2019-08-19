import * as jwt from 'jsonwebtoken';
import User from '../entities/user';
import { Request, Response, NextFunction } from 'express';
import { AdvancedConsoleLogger } from 'typeorm';

const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if(req.path.indexOf('/api') === 0)
    console.log(req.path);

  if (!req.cookies || !('access_token' in req.cookies)){
    next(); // 토큰이 없음
  }
  else{
    const token = req.cookies.access_token;

    try{
      const decoded = <any>jwt.verify(token, process.env.JWT_SECRET);
      res.locals.user = {
        _id: decoded._id,
        username: decoded.username,
      };
      // 토큰 3.5일 미만 남으면 재발급
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp - now < 60 * 60 * 24 * 3.5) {
        const user = await User.findOne(decoded._id);
        const token = user.generateToken();
        res.cookie('access_token', token, {
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
          httpOnly: true,
        });
      }
      next();
    } catch (e) {
      // 토큰 검증 실패
      console.log(e);
      next();
    }
  }
};

export default jwtMiddleware;