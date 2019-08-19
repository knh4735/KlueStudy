import { Request, Response, NextFunction } from 'express';
import { Like } from "typeorm";
import Post from '../../entities/post';
import * as Joi from 'joi';
import * as sanitizeHtml from 'sanitize-html';

const sanitizeOption = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote', 
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};

export const getPostById = async (req, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const post = await Post.findOne(id);
    // 포스트가 존재하지 않을 때
    if (!post) {
      res.status(404).send(); // Not Found
      return;
    }
    res.locals.post = post;
    next();
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};

export const checkOwnPost = (req:Request, res:Response, next: NextFunction) => {
  const { user, post } = res.locals;

  if (post.user._id !== user._id) {
    res.status(403).send();
    return;
  }
  next();
};

/*
  POST /api/posts
  {
    title: '제목',
    body: '내용',
    tags: ['태그1', '태그2']
  }
*/
export const write = async (req:Request, res:Response) => {
  const schema = Joi.object().keys({
    // 객체가 다음 필드를 가지고 있음을 검증
    title: Joi.string().required(), // required() 가 있으면 필수 항목
    body: Joi.string().required(),
    tags: Joi.array()
      .items(Joi.string())
      .required(), // 문자열로 이루어진 배열
  });

  // 검증 후, 검증 실패시 에러처리
  const result = Joi.validate(req.body, schema);
  if (result.error) {
    res.status(400).send(result.error); // Bad Request
    return;
  }

  const { title, body, tags } = req.body;

  const post = new Post();
  post.title = title;
  post.body = sanitizeHtml(body, sanitizeOption);
  post.tags = tags,
  post.user = res.locals.user;

  try {
    await post.save();
    res.send(post);
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};

// html 을 없애고 내용이 너무 길으면 200자로 제한시키는 함수
const removeHtmlAndShorten = body => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

/*
  GET /api/posts?username=&tag=&page=
*/
export const list = async (req:Request, res:Response) => {
  // query 는 문자열이기 때문에 숫자로 변환해주어야합니다.
  // 값이 주어지지 않았다면 1 을 기본으로 사용합니다.
  const page = parseInt(req.query.page || '1', 10);
  if (page < 1) {
    res.status(400).send();
    return;
  }

  const { tag, username } = req.query;
  // tag, username 값이 유효하면 객체 안에 넣고, 그렇지 않으면 넣지 않음
  const where:any = 
    (tag ?  
      [
        { tags: Like(`${tag}`), ...(username ? { 'user.username': username } : {}) },
        { tags: Like(`%,${tag},%`), ...(username ? { 'user.username': username } : {}) },
        { tags: Like(`${tag},%`), ...(username ? { 'user.username': username } : {})},
        { tags: Like(`%,${tag}`), ...(username ? { 'user.username': username } : {})},
      ]
      : (username ? { 'user.username': username } : {})
    );

  const query:{
    where: Object,
    order: Object,
    skip: number,
    take: number
  } = {
    where,
    order: {
      _id: "DESC",
    },
    skip: (page - 1) * 10,
    take: 10
  };

  try {
    const posts = await Post.find(query);
    const postCount = Math.ceil((await Post.find(where)).length / 10);
    res.set('Last-Page', `${postCount > 0 ? postCount : 1}`);
    res.send(posts.map(post => ({
      ...post,
      body: removeHtmlAndShorten(post.body),
    })));
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};

/*
  GET /api/posts/:id
*/
export const read = async (req:Request, res:Response) => {
  res.send(res.locals.post);
};

/*
  DELETE /api/posts/:id
*/
export const remove = async (req, res:Response) => {
  const { id } = req.params;

  try {
    const post = await Post.findOne(id);
    await post.remove();
    res.status(204).send(); // No Content (성공은 했지만 응답할 데이터는 없음)
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};

/*
  PATCH /api/posts/:id
  {
    title: '수정',
    body: '수정 내용',
    tags: ['수정', '태그']
  }
*/
export const update = async (req, res:Response) => {
  const { id } = req.params;

  // write 에서 사용한 schema 와 비슷한데, required() 가 없습니다.
  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });

  // 검증 후, 검증 실패시 에러처리
  const result = Joi.validate(req.body, schema);
  if (result.error) {
    res.status(400).send(result.error); // Bad Request
    return;
  }

  const nextData = req.body;
  try {
    const post = await Post.findOne(id);

    if (!post) {
      res.status(404).send();
      return;
    }

    post.title = nextData.title;
    post.body = (nextData.body ? sanitizeHtml(nextData.body) : nextData.body);
    post.tags = nextData.tags;
    await Post.save(post);
    
    res.send(post);
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "Error!" });
  }
};