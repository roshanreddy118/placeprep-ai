import { connectDB } from "@/lib/mongodb";
import { User, SubscriptionStatus } from "@/models/User";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isActive: boolean;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  daysLeft: number;
}

export async function getSubscriptionInfo(
  userId: string
): Promise<SubscriptionInfo> {
  await connectDB();
  const user = await User.findById(userId);

  if (!user) {
    return {
      status: "expired",
      isActive: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      daysLeft: 0,
    };
  }

  const now = new Date();

  // Active paid subscription
  if (user.subscription === "active" && user.subscriptionEndsAt) {
    const endsAt = new Date(user.subscriptionEndsAt);
    if (endsAt > now) {
      const daysLeft = Math.ceil(
        (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        status: "active",
        isActive: true,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: endsAt,
        daysLeft,
      };
    }
    // Subscription expired
    await User.findByIdAndUpdate(userId, { subscription: "expired" });
    return {
      status: "expired",
      isActive: false,
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: endsAt,
      daysLeft: 0,
    };
  }

  // Trial period
  if (user.subscription === "trial") {
    const trialEnd = new Date(user.trialEndsAt);
    if (trialEnd > now) {
      const daysLeft = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        status: "trial",
        isActive: true,
        trialEndsAt: trialEnd,
        subscriptionEndsAt: null,
        daysLeft,
      };
    }
    // Trial expired — but app is free, keep access
    return {
      status: "trial",
      isActive: true,
      trialEndsAt: trialEnd,
      subscriptionEndsAt: null,
      daysLeft: 0,
    };
  }

  // Default — app is free for all users
  return {
    status: user.subscription,
    isActive: true,
    trialEndsAt: user.trialEndsAt,
    subscriptionEndsAt: user.subscriptionEndsAt,
    daysLeft: 0,
  };
}
