import { useState } from "react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function ImageWithFallback({ src, alt, ...props }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground"
        {...props}
      >
        {alt}
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setError(true)} {...props} />;
}
