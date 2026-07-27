import { useEffect, useState, useRef } from 'react';
import type { RefObject } from 'react';

export const useElementVisibility = <T extends HTMLElement = HTMLElement>(
  options?: IntersectionObserverInit
): [RefObject<T | null>, boolean] => {
  const elementRef = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(currentElement);

    return () => {
      observer.unobserve(currentElement);
    };
  }, [options]);

  return [elementRef, isVisible];
};
