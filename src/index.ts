require('dotenv').config();
import * as express from "express";
import { Router, Request, Response } from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as http from 'http';
import { createConnection } from 'typeorm';
import * as path from 'path';
import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';

// 비구조화 할당을 통하여 process.env 내부 값에 대한 레퍼런스 만들기
const { PORT } = process.env;

createConnection().then(connection => {
  const app = express();

  const router:Router = Router();
  
  // 라우터 적용 전에 bodyParser 적용
  //app.use(bodyparser());
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(jwtMiddleware);
  
  // 라우터 설정
  router.use('/api', api); // api 라우트 적용
  app.use(router);//.use(router.allowedMethods());
  
  const buildDirectory = path.resolve('.', '../blog-frontend/build');
  
  app.set('views', buildDirectory);
  app.use(express.static(buildDirectory));
  
  app.use((req:Request, res:Response) => {
    // Not Found 이고, 주소가 /api 로 시작하지 않는 경우
    if(req.path.indexOf('/api') !== 0)
      res.redirect('/');
  });
  
  // PORT 가 지정되어있지 않다면 4000 을 사용
  const port = PORT || 4000;
  app.set("port", port);
  http.createServer(app).listen(port, () => {
    console.log('Listening to port %d', port);
  });
})
.catch(error => {
  console.log(error);
});
