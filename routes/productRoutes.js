import express from "express";
import {
  createProducts,
  creatingReviewProduct,
  deleteProduct,
  deleteReview,
  getAdminProducts,
  getAllProducts,
  getProductReviews,
  getSingleProduct,
  updateProduct,
} from "../controller/productController.js";
import { roleBasedAccess, verifyUserAuth } from "../middleware/userAuth.js";

const router = express.Router();

// All products
//routes
router.route("/products").get(getAllProducts);

router.route("/admin/products").get(verifyUserAuth, roleBasedAccess("admin"), getAdminProducts);

router
  .route("/admin/product/create")
  .post(verifyUserAuth, roleBasedAccess("admin"), createProducts);

// Single product (by id) 
router
  .route("/admin/products/:id")
  .put(verifyUserAuth, roleBasedAccess("admin"), updateProduct)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteProduct);

router.route("/product/:id").get(getSingleProduct);

router.route("/review").put(verifyUserAuth, creatingReviewProduct);

// router.route("/reviews").get(getProductReviews);
// router.route("/reviews").get(getProductReviews).delete(verifyUserAuth,deleteReview)


router
  .route("/admin/reviews")
  .get(verifyUserAuth, roleBasedAccess("admin"), getProductReviews)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteReview);
export default router;


