import { Request, Response, NextFunction } from 'express';
import User from '../../entities/user';
import * as Joi from 'joi';

/*
  POST /api/auth/register
  {
    username: 'velopert',
    password: 'mypass123'
  }
*/
export const register = async (req: Request, res: Response, next: NextFunction)  => {
  // Request Body 검증하기
  const schema = Joi.object().keys({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required(),
    password: Joi.string().required(),
  });
  const result = Joi.validate(req.body, schema);

  if (result.error) {
    res.status(400).send(result.error);
    return;
  }

  const { username, password } = req.body;
  try {
    // username  이 이미 존재하는지 확인
    const exists = await User.findByUsername(username);
    if (exists) {
      console.log("DuplicatedAccount");
      res.status(409).send(); // Conflict
      return;
    }

    const user = new User();
    user.username = username;
    user.setPassword(password); // 비밀번호 설정
    await user.save(); // 데이터베이스에 저장

    const token = user.generateToken();
    res.cookie('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true,
    });

    res.send(user.serialize());
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};

/*
  POST /api/auth/login
  {
    username: 'velopert',
    password: 'mypass123'
  }
*/
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  // username, password 가 없으면 에러 처리
  if (!username || !password) {
    res.status(401).send(); // Unauthorized
    return;
  }

  try {
    const user = await User.findByUsername(username);
    // 계정이 존재하지 않으면 에러 처리
    if (!user) {
      console.log("Wrong Username");
      res.status(401).send();
      return;
    }
    const valid = await user.checkPassword(password);
    // 잘못된 비밀번호
    if (!valid) {
      console.log("Wrong Password");
      res.status(401).send(); // Unauthorized
      return;
    }

    const token = user.generateToken();
    res.cookie('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true,
    });

    res.send(user.serialize());
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};

/*
  GET /api/auth/check
*/
export const check = async (req: Request, res: Response, next: NextFunction) => {
  const { user } = res.locals;

  if (!user) {
    // 로그인중 아님
    res.status(401).send(); // Unauthorized
    return;
  }
  res.send(user);
};

/*
  POST /api/auth/logout
*/
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('access_token', '', {maxAge: 0, expires: new Date(0)});
  res.clearCookie('access_token');
  res.status(204).send();
};