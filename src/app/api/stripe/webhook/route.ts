import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  await connectDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const periodEnd = new Date(
          subscription.items.data[0].current_period_end * 1000
        );

        await User.findByIdAndUpdate(userId, {
          subscription: "active",
          stripeSubscriptionId: subscription.id,
          subscriptionEndsAt: periodEnd,
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = new Date(
          subscription.items.data[0].current_period_end * 1000
        );

        await User.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          {
            subscription: "active",
            subscriptionEndsAt: periodEnd,
          }
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          subscription: "cancelled",
          stripeSubscriptionId: null,
        }
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

      if (subscriptionId) {
        await User.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          { subscription: "expired" }
        );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
