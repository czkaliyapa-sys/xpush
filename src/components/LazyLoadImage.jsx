import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * LazyLoadImage Component - Displays image with lazy loading and skeleton placeholder
 */
export const LazyLoadImage = ({ src, alt, className, style, onLoad, fallback }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start loading the image
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            if (onLoad) onLoad();
          };
          img.onerror = () => {
            // Load fallback or keep original on error
            setImageSrc(fallback || src);
            setIsLoaded(true);
          };
          img.src = src;
          if (imgElement) {
            observer.unobserve(imgElement);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgElement) {
      observer.observe(imgElement);
    }

    return () => {
      if (imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [src, fallback, onLoad]);

  return (
    <div ref={imgRef} style={{ position: 'relative', ...style }}>
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px'
          }}
        />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
    </div>
  );
};

/**
 * LazyLoadGadgetCard - Wrapper for gadget card with lazy loading
 */
export const LazyLoadGadgetCard = ({ children, gadgetId }) => {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const containerElement = containerRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (containerElement) {
            observer.unobserve(containerElement);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: '100px'
      }
    );

    if (containerElement) {
      observer.observe(containerElement);
    }

    return () => {
      if (containerElement) {
        observer.unobserve(containerElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef}>
      {isInView ? children : <CardSkeleton />}
    </div>
  );
};

/**
 * CardSkeleton - Placeholder while card is loading
 */
const CardSkeleton = () => (
  <Box
    sx={{
      bgcolor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 2,
      p: 2,
      border: '1px solid rgba(72, 206, 219, 0.2)',
      minHeight: '400px',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }}
  >
    <Skeleton variant="rectangular" height={250} sx={{ mb: 2, borderRadius: 1 }} />
    <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
    <Skeleton variant="text" height={20} width="80%" sx={{ mb: 2 }} />
    <Skeleton variant="text" height={24} width="60%" />
  </Box>
);

export default LazyLoadImage;
