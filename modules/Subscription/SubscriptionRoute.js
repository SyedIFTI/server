const stripe = require("stripe")(process.env.stripeKey);
const express = require("express");
const router = express.Router();
const { userAuth } = require("../../middleware/AuthMiddleware");
const { UserModel } = require("../../models/UserModel");
router.post("/create", userAuth, async (req, res, next) => {
  const { planId } = req.body;
  const { email } = req.user;
  console.log(email);

  const user = await UserModel.findOne({ email });

  if (user && user.stripeCustomerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
    });

    if (subscriptions.data.length > 0) {
      const activeSubscription = subscriptions.data.find(
        (sub) => sub.status === "active" || sub.status === "trial"
      );

      if (activeSubscription) {
        return next({
          message: "You already have an active subscription.",
          status: 400,
        });
      }
    }
  }

  let customer;
  if (!user || !user.stripeCustomerId) {
    customer = await stripe.customers.create({
      email,
    });

    if (user) {
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      await UserModel.create({ email, stripeCustomerId: customer.id });
    }
  } else {
    customer = { id: user.stripeCustomerId };
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: planId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `http://localhost:5173/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`, // Redirect after success
    cancel_url: "http://localhost:3000/cancel", // Redirect after cancel
    customer: customer.id,
  });

  res.json({ id: session.id });
});
router.get('/payment-details', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json({
      amount_total: session.amount_total, // Amount in cents
      payment_method_types: session.payment_method_types, 
      customer_email: session.customer_details.email, 
    });
  } catch (error) {
    console.error('Error retrieving payment session:', error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

router.get("status", async (req, res) => {
  const { stripeCustomerId } = req.query;

  const user = await UserModel.findOne({ stripeCustomerId });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all", // active, past_due, canceled, etc.
  });

  const activeSubscription = subscriptions.data.find(
    (sub) => sub.status === "active" || sub.status === "trial"
  );

  res.json({
    subscriptionStatus: user.subscriptionStatus,
    subscriptionPlan: user.subscriptionPlan,
    activeSubscription: activeSubscription ? true : false,
    imageGenerationCount: user.imageGenerationCount,
    imageGenerationLimit: user.imageGenerationLimit,
    videoGenerationCount: user.videoGenerationCount,
    videoGenerationLimit: user.videoGenerationLimit,
  });
});
module.exports = router;
