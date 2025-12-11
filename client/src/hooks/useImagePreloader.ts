import { useState, useEffect } from "react";

export function useImagePreloader(imageSources: string[]) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imageSources.length === 0) {
      setLoaded(true);
      return;
    }

    let isMounted = true;
    const images = imageSources.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    ).then(() => {
      if (isMounted) setLoaded(true);
    });

    const timeout = setTimeout(() => {
      if (isMounted) setLoaded(true);
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [imageSources]);

  return loaded;
}
