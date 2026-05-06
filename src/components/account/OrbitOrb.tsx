"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import OrbitIcon from "./OrbitIcon";

/**
 * Floating Saturn icon — fixed top-right when signed in.
 * Click → /account.
 */
export default function OrbitOrb() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <Link
      href="/account"
      aria-label="마이페이지"
      className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
    >
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        whileHover={{ scale: 1.08 }}
      >
        <OrbitIcon size={48} />
      </motion.div>
    </Link>
  );
}
