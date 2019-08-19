import { Router } from "express";
import * as postsCtrl from './posts.ctrl';
import checkLoggedIn from '../../lib/checkLoggedIn';

const posts:Router = Router();

posts.get('/', postsCtrl.list);

posts.post('/', checkLoggedIn, postsCtrl.write);

posts.get('/:id', postsCtrl.getPostById, postsCtrl.read);
posts.delete('/:id', postsCtrl.getPostById, checkLoggedIn, postsCtrl.checkOwnPost, postsCtrl.remove);
posts.patch('/:id', postsCtrl.getPostById, checkLoggedIn, postsCtrl.checkOwnPost, postsCtrl.update);


export default posts;