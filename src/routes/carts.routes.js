import { Router } from 'express';
import cartsController from '../controllers/carts.controller.js';
import { authorization, passportError } from '../utils/messageErrors.js';
const cartRouter = Router();

cartRouter.get('/', cartsController.getCarts);
cartRouter.get('/:cid', cartsController.getCart);
cartRouter.post('/:cid/purchase', cartsController.purchaseCart);
cartRouter.post('/', cartsController.postCart);
cartRouter.put(
	'/:cid/product/:pid',
	passportError('jwt'),
	authorization('user'),
	cartsController.putProductToCart
);
cartRouter.put(
	'/:cid/products/:pid',
	passportError('jwt'),
	authorization('user'),
	cartsController.putQuantity
);
cartRouter.put(
	'/:cid',
	passportError('jwt'),
	authorization('user'),
	cartsController.putProductsToCart
);
cartRouter.delete('/:cid', passportError('jwt'), authorization('user'), cartsController.deleteCart);
cartRouter.delete(
	'/:cid/products/:pid',
	passportError('jwt'),
	authorization('user'),
	cartsController.deleteProductFromCart
);

export default cartRouter;