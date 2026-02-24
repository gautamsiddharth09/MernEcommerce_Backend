import Order from "../model/orderModel.js";
import Product from "../model/productModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";


// 1️ Create New Order
export const createNewOrder = handleAsyncError(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// 2️ Get Single Order
export const getSingleOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    return next(new HandleError("No order found with this ID", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// 3️ Get All Orders of Logged-in User
export const allMyOrders = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// 4️ Get All Orders (Admin)
export const getAllOrders = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find();

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// 5️ Update Order Status (Admin)
export const updateOrderStatus = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new HandleError("No order found with this ID", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new HandleError("This order has already been delivered", 400));
  }

  // Update product stock
  await Promise.all(
    order.orderItems.map((item) => updateProductStock(item.product, item.quantity))
  );

  order.orderStatus = req.body.status;

  if (order.orderStatus === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    order,
  });
});

// Helper function to update product stock
async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new HandleError("Product not found", 404);
  }
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

// 6️ Delete Order (Admin)
export const deleteOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new HandleError("No order found with this ID", 404));
  }

  if (order.orderStatus !== "Delivered") {
    return next(
      new HandleError("Only delivered orders can be deleted", 400)
    );
  }

  await Order.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});
