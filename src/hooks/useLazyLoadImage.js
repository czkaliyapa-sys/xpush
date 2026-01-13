import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for lazy loading images using Intersection Observer API
 * @param {Object} options - Configuration options
 * @param {string} options.threshold - Intersection observer threshold (default: '0.1')
 * @param {string} options.rootMargin - Root margin for preloading (default: '50px')
 * @returns {Object} - { ref, isVisible, imageSrc }
 */
export const useLazyLoadImage = (imageSrc, options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px'
  } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, load the image
          if (imageSrc) {
            // Preload the image
            const img = new Image();
            img.onload = () => {
              setLoadedSrc(imageSrc);
            };
            img.onerror = () => {
              // Still show the image even if it fails to load
              setLoadedSrc(imageSrc);
            };
            img.src = imageSrc;
          }
          // Unobserve once loaded
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [imageSrc, threshold, rootMargin]);

  return {
    ref: elementRef,
    isVisible,
    imageSrc: loadedSrc,
    isLoading: isVisible && !loadedSrc
  };
};

/**
 * Higher-order component wrapper for lazy loading
 */
export const withLazyLoad = (Component) => {
  return React.forwardRef((props, ref) => {
    const { imageUrl, ...rest } = props;
    const { ref: lazyRef, imageSrc, isVisible, isLoading } = useLazyLoadImage(imageUrl);

    return (
      <div ref={lazyRef}>
        <Component
          ref={ref}
          {...rest}
          imageUrl={imageSrc}
          isImageLoading={isLoading}
          isImageVisible={isVisible}
        />
      </div>
    );
  });
};
