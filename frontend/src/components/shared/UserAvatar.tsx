"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

export const DEFAULT_AVATAR = "/images/default-avatar.svg";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  fallbackSrc?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "User Avatar",
  size = 36,
  className = "size-9 rounded-lg object-cover border border-border",
  fallbackSrc = DEFAULT_AVATAR,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the src prop changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const hasValidSrc = !hasError && src && src.trim() !== "";
  const displaySrc = hasValidSrc ? src : fallbackSrc;

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
