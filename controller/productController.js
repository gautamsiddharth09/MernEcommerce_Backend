import Product from "../model/productModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import APIFunctionality from "../utils/apiFunctionality.js";
import { v2 as cloudinary } from "cloudinary";

// 1️ Create a product
export const createProducts = handleAsyncError(async (req, res, next) => {
  let image = [];
  if (typeof req.body.image === "string") {
    image.push(req.body.image);
  } else {
    image = req.body.image;
  }

  // adding images
  const imageLinks = [];
  for (let i = 0; i < image.length; i++) {
    const result = await cloudinary.uploader.upload(image[i], {
      folder: "products",
    });
    imageLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.image = imageLinks;

  req.body.user = req.user._id; // ensure correct user id
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// 2️ Get all products with search, filter & pagination
export const getAllProducts = handleAsyncError(async (req, res, next) => {
  const resultPerPage = 4;
  const apiFeatures = new APIFunctionality(Product.find(), req.query)
    .search()
    .filter();

  // Get filtered count before pagination
  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();

  const totalPages = Math.ceil(productCount / resultPerPage);
  const page = Number(req.query.page) || 1;

  if (page > totalPages && productCount > 0) {
    return next(new HandleError("This page doesn't exist", 404));
  }

  // Apply pagination
  apiFeatures.pagination(resultPerPage);
  const products = await apiFeatures.query;

  res.status(200).json({
    success: true,
    products,
    productCount,
    resultPerPage,
    totalPages,
    currentPage: page,
  });
});

// 3️ Update a product
export const updateProduct = handleAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

   if (!product) {
    return next(new HandleError("Product not found", 404));
  }
  
  let images = [];
  if (typeof req.body.image === "string") {
    images.push(req.body.image);
  } else if (Array.isArray(req.body.image)) {
    images = req.body.image;
  }

  if (images.length > 0) {
    // delete old images
    for (let i = 0; i < product.image.length; i++) {
      await cloudinary.uploader.destroy(product.image[i].public_id);
    }
    // upload new images
    const imageLinks = [];
    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });
      imageLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
     req.body.image = imageLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// 4️ Delete a product
export const deleteProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }
  // delete image from cloudinary
  for(let i=0; i < product.image.length; i++){
    await cloudinary.uploader.destroy(product.image[i].public_id)
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// 5️ Get single product
export const getSingleProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// 6️ Create or update a review
export const creatingReviewProduct = handleAsyncError(
  async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(productId);
    if (!product) return next(new HandleError("Product not found", 404));

    const reviewExists = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString(),
    );

    if (reviewExists) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString()) {
          rev.rating = rating;
          rev.comment = comment;
        }
      });
    } else {
      product.reviews.push(review);
    }

    // Update number of reviews & ratings
    product.numOfReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
      product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      product,
    });
  },
);

// 7️ Get all reviews for a product
export const getProductReviews = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) return next(new HandleError("Product not found", 404));

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// 8️ Delete a review
export const deleteReview = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) return next(new HandleError("Product not found", 404));

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString(),
  );

  const numOfReviews = reviews.length;
  const ratings =
    reviews.reduce((acc, rev) => acc + rev.rating, 0) / (numOfReviews || 1);

  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, numOfReviews, ratings },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// 9️ Admin - Get all products
export const getAdminProducts = handleAsyncError(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products,
  });
});
